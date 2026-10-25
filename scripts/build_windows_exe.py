#!/usr/bin/env python3
import os
import sys
import glob
import zipfile

def build():
    print("=== Building Windows Standalone Executable ===")

    # Ensure dist exists
    if not os.path.exists("dist/index.html"):
        print("Error: dist/index.html not found. Run npm run build first.")
        sys.exit(1)

    os.makedirs("public/downloads", exist_ok=True)
    os.makedirs("build_exe", exist_ok=True)

    # Read index.html
    with open("dist/index.html", "rb") as f:
        html_data = f.read()

    # Find JS and CSS assets
    js_files = glob.glob("dist/assets/*.js")
    css_files = glob.glob("dist/assets/*.css")

    if not js_files or not css_files:
        print("Error: JS or CSS assets missing in dist/assets")
        sys.exit(1)

    js_file = js_files[0]
    css_file = css_files[0]

    with open(js_file, "rb") as f:
        js_data = f.read()

    with open(css_file, "rb") as f:
        css_data = f.read()

    js_rel = os.path.basename(js_file)
    css_rel = os.path.basename(css_file)

    print(f"HTML size: {len(html_data)} bytes")
    print(f"JS ({js_rel}) size: {len(js_data)} bytes")
    print(f"CSS ({css_rel}) size: {len(css_data)} bytes")

    # Generate launcher.c
    # We will write an embedded HTTP server in C using WinSock2
    # It listens on 127.0.0.1:48192 and serves HTML, JS, CSS, and favicon
    c_source = f"""
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <shellapi.h>
#include <shlwapi.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "shlwapi.lib")

#define PORT 48192
#define BUFFER_SIZE 4096

// Embedded asset declarations
extern const unsigned char asset_html[];
extern const unsigned int asset_html_len;

extern const unsigned char asset_js[];
extern const unsigned int asset_js_len;

extern const unsigned char asset_css[];
extern const unsigned int asset_css_len;

const char* JS_FILENAME = "{js_rel}";
const char* CSS_FILENAME = "{css_rel}";

DWORD WINAPI HttpServerThread(LPVOID lpParam) {{
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {{
        return 1;
    }}

    SOCKET server_socket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (server_socket == INVALID_SOCKET) {{
        WSACleanup();
        return 1;
    }}

    BOOL optval = TRUE;
    setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, (char*)&optval, sizeof(optval));

    struct sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = inet_addr("127.0.0.1");
    server_addr.sin_port = htons(PORT);

    if (bind(server_socket, (struct sockaddr*)&server_addr, sizeof(server_addr)) == SOCKET_ERROR) {{
        closesocket(server_socket);
        WSACleanup();
        return 1;
    }}

    if (listen(server_socket, 16) == SOCKET_ERROR) {{
        closesocket(server_socket);
        WSACleanup();
        return 1;
    }}

    while (1) {{
        struct sockaddr_in client_addr;
        int client_len = sizeof(client_addr);
        SOCKET client_socket = accept(server_socket, (struct sockaddr*)&client_addr, &client_len);
        if (client_socket == INVALID_SOCKET) {{
            continue;
        }}

        char buffer[BUFFER_SIZE];
        int bytes_read = recv(client_socket, buffer, sizeof(buffer) - 1, 0);
        if (bytes_read > 0) {{
            buffer[bytes_read] = '\\0';

            char method[16], path[512];
            sscanf(buffer, "%15s %511s", method, path);

            // Strip query params
            char* q = strchr(path, '?');
            if (q) *q = '\\0';

            const unsigned char* body = NULL;
            unsigned int body_len = 0;
            const char* content_type = "text/html; charset=utf-8";

            if (strcmp(path, "/") == 0 || strcmp(path, "/index.html") == 0) {{
                body = asset_html;
                body_len = asset_html_len;
                content_type = "text/html; charset=utf-8";
            }} else if (strstr(path, JS_FILENAME) != NULL || strstr(path, ".js") != NULL) {{
                body = asset_js;
                body_len = asset_js_len;
                content_type = "application/javascript; charset=utf-8";
            }} else if (strstr(path, CSS_FILENAME) != NULL || strstr(path, ".css") != NULL) {{
                body = asset_css;
                body_len = asset_css_len;
                content_type = "text/css; charset=utf-8";
            }} else {{
                // Fallback to index.html for SPA client-side routing
                body = asset_html;
                body_len = asset_html_len;
                content_type = "text/html; charset=utf-8";
            }}

            char header[512];
            int header_len = snprintf(header, sizeof(header),
                "HTTP/1.1 200 OK\\r\\n"
                "Content-Type: %s\\r\\n"
                "Content-Length: %u\\r\\n"
                "Connection: close\\r\\n"
                "Access-Control-Allow-Origin: *\\r\\n"
                "Cache-Control: no-cache\\r\\n"
                "\\r\\n",
                content_type, body_len);

            send(client_socket, header, header_len, 0);
            send(client_socket, (const char*)body, body_len, 0);
        }}

        closesocket(client_socket);
    }}

    closesocket(server_socket);
    WSACleanup();
    return 0;
}}

void LaunchAppWindow() {{
    char app_url[128];
    snprintf(app_url, sizeof(app_url), "http://127.0.0.1:%d", PORT);

    // Sleep 150ms to ensure server is listening
    Sleep(150);

    // 1. Try launching via Microsoft Edge in dedicated --app mode (standard on Win 10 / 11)
    char edge_args[512];
    snprintf(edge_args, sizeof(edge_args), "--app=%s --window-size=1360,860", app_url);

    HINSTANCE hEdge = ShellExecuteA(NULL, "open", "msedge.exe", edge_args, NULL, SW_SHOWNORMAL);
    if ((INT_PTR)hEdge > 32) {{
        return;
    }}

    // 2. Try Chrome --app mode
    HINSTANCE hChrome = ShellExecuteA(NULL, "open", "chrome.exe", edge_args, NULL, SW_SHOWNORMAL);
    if ((INT_PTR)hChrome > 32) {{
        return;
    }}

    // 3. Fallback to default browser
    ShellExecuteA(NULL, "open", app_url, NULL, NULL, SW_SHOWNORMAL);
}}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {{
    // Create server background thread
    HANDLE hThread = CreateThread(NULL, 0, HttpServerThread, NULL, 0, NULL);
    if (!hThread) {{
        MessageBoxA(NULL, "Failed to start IPTV ERD local engine.", "Error", MB_ICONERROR | MB_OK);
        return 1;
    }}

    // Launch UI
    LaunchAppWindow();

    // Keep thread alive
    WaitForSingleObject(hThread, INFINITE);
    CloseHandle(hThread);

    return 0;
}}
"""

    with open("build_exe/launcher.c", "w") as f:
        f.write(c_source)

    # Write data arrays
    print("Writing asset binary arrays to C files...")

    def write_c_array(filename, var_name, data):
        with open(filename, "w") as f:
            f.write(f"#include <stddef.h>\n\n")
            f.write(f"const unsigned int {var_name}_len = {len(data)};\n")
            f.write(f"const unsigned char {var_name}[] = {{\n")
            # Write in chunks of 16 bytes
            for i in range(0, len(data), 16):
                chunk = data[i:i+16]
                hex_str = ", ".join(f"0x{b:02x}" for b in chunk)
                f.write(f"  {hex_str},\n")
            f.write("};\n")

    write_c_array("build_exe/asset_html.c", "asset_html", html_data)
    write_c_array("build_exe/asset_css.c", "asset_css", css_data)
    write_c_array("build_exe/asset_js.c", "asset_js", js_data)

    print("Compiling Windows PE 64-bit GUI Executable with x86_64-w64-mingw32-gcc...")
    cmd = (
        "x86_64-w64-mingw32-gcc -O2 -mwindows "
        "build_exe/launcher.c build_exe/asset_html.c build_exe/asset_css.c build_exe/asset_js.c "
        "-o public/downloads/IPTV-ERD-Player.exe "
        "-lws2_32 -lshlwapi"
    )
    res = os.system(cmd)
    if res != 0:
        print(f"Compilation failed with exit code {res}")
        sys.exit(1)

    exe_size = os.path.getsize("public/downloads/IPTV-ERD-Player.exe")
    print(f"SUCCESS! Created public/downloads/IPTV-ERD-Player.exe ({exe_size} bytes, {exe_size/(1024*1024):.2f} MB)")

    # Also build the portable zip bundle
    print("Creating portable ZIP package...")
    zip_path = "public/downloads/IPTV-ERD-Player-Windows-x64.zip"

    # Create batch launcher
    bat_content = """@echo off
title Стартиране на IPTV ERD Player...
echo ========================================================
echo   IPTV ERD Player & M3U Редактор (Windows Standalone)
echo ========================================================
echo Стартиране на програмата без нужда от инсталация...
start "" "%~dp0IPTV-ERD-Player.exe"
exit
"""
    with open("build_exe/Start-IPTV.bat", "w", encoding="cp1251") as f:
        f.write(bat_content)

    readme_content = """===============================================================
  IPTV ERD Player & M3U Редактор (Windows Standalone EXE)
===============================================================

Честито! Тази програма е напълно готова за използване и НЕ изисква
инсталирането на IPTV ERD Editor или какъвто и да е друг допълнителен софтуер!

КАК СЕ СТАРТИРА:
1. Щракнете два пъти върху: IPTV-ERD-Player.exe
2. Плеърът с вградения редактор се отваря автоматично в самостоятелен десктоп прозорец!

ОСНОВНИ ВЪЗМОЖНОСТИ:
- VLC стил стрийминг на HLS (.m3u8), TS и онлайн канали
- Пълен вграден ERD редактор за листи (канали, линкове, лога, групи)
- Редактиране в реално време, докато гледате ТВ - картината не спира!
- Масово редактиране (Batch Editor) - преименуване, смяна на категория, търсене/замяна
- Моментален експорт на чист стандартен .M3U и .M3U8 файл
- Стартира с чиста празна листа, готова за зареждане на вашите листи
- Автоматично запазване на промените

Приятно гледане!

"""
    with open("build_exe/README-Инструкции.txt", "w", encoding="utf-8") as f:
        f.write(readme_content)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.write("public/downloads/IPTV-ERD-Player.exe", "IPTV-ERD-Player.exe")
        z.write("build_exe/Start-IPTV.bat", "Стартирай-IPTV.bat")
        z.write("build_exe/README-Инструкции.txt", "README-Инструкции.txt")

    zip_size = os.path.getsize(zip_path)
    print(f"SUCCESS! Created {zip_path} ({zip_size/(1024*1024):.2f} MB)")

if __name__ == "__main__":
    build()
