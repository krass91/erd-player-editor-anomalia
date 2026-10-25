
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

const char* JS_FILENAME = "index-DK0P8CEx.js";
const char* CSS_FILENAME = "index-DVX6yogZ.css";

DWORD WINAPI HttpServerThread(LPVOID lpParam) {
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        return 1;
    }

    SOCKET server_socket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (server_socket == INVALID_SOCKET) {
        WSACleanup();
        return 1;
    }

    BOOL optval = TRUE;
    setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, (char*)&optval, sizeof(optval));

    struct sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = inet_addr("127.0.0.1");
    server_addr.sin_port = htons(PORT);

    if (bind(server_socket, (struct sockaddr*)&server_addr, sizeof(server_addr)) == SOCKET_ERROR) {
        closesocket(server_socket);
        WSACleanup();
        return 1;
    }

    if (listen(server_socket, 16) == SOCKET_ERROR) {
        closesocket(server_socket);
        WSACleanup();
        return 1;
    }

    while (1) {
        struct sockaddr_in client_addr;
        int client_len = sizeof(client_addr);
        SOCKET client_socket = accept(server_socket, (struct sockaddr*)&client_addr, &client_len);
        if (client_socket == INVALID_SOCKET) {
            continue;
        }

        char buffer[BUFFER_SIZE];
        int bytes_read = recv(client_socket, buffer, sizeof(buffer) - 1, 0);
        if (bytes_read > 0) {
            buffer[bytes_read] = '\0';

            char method[16], path[512];
            sscanf(buffer, "%15s %511s", method, path);

            // Strip query params
            char* q = strchr(path, '?');
            if (q) *q = '\0';

            const unsigned char* body = NULL;
            unsigned int body_len = 0;
            const char* content_type = "text/html; charset=utf-8";

            if (strcmp(path, "/") == 0 || strcmp(path, "/index.html") == 0) {
                body = asset_html;
                body_len = asset_html_len;
                content_type = "text/html; charset=utf-8";
            } else if (strstr(path, JS_FILENAME) != NULL || strstr(path, ".js") != NULL) {
                body = asset_js;
                body_len = asset_js_len;
                content_type = "application/javascript; charset=utf-8";
            } else if (strstr(path, CSS_FILENAME) != NULL || strstr(path, ".css") != NULL) {
                body = asset_css;
                body_len = asset_css_len;
                content_type = "text/css; charset=utf-8";
            } else {
                // Fallback to index.html for SPA client-side routing
                body = asset_html;
                body_len = asset_html_len;
                content_type = "text/html; charset=utf-8";
            }

            char header[512];
            int header_len = snprintf(header, sizeof(header),
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: %s\r\n"
                "Content-Length: %u\r\n"
                "Connection: close\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Cache-Control: no-cache\r\n"
                "\r\n",
                content_type, body_len);

            send(client_socket, header, header_len, 0);
            send(client_socket, (const char*)body, body_len, 0);
        }

        closesocket(client_socket);
    }

    closesocket(server_socket);
    WSACleanup();
    return 0;
}

void LaunchAppWindow() {
    char app_url[128];
    snprintf(app_url, sizeof(app_url), "http://127.0.0.1:%d", PORT);

    // Sleep 150ms to ensure server is listening
    Sleep(150);

    // 1. Try launching via Microsoft Edge in dedicated --app mode (standard on Win 10 / 11)
    char edge_args[512];
    snprintf(edge_args, sizeof(edge_args), "--app=%s --window-size=1360,860", app_url);

    HINSTANCE hEdge = ShellExecuteA(NULL, "open", "msedge.exe", edge_args, NULL, SW_SHOWNORMAL);
    if ((INT_PTR)hEdge > 32) {
        return;
    }

    // 2. Try Chrome --app mode
    HINSTANCE hChrome = ShellExecuteA(NULL, "open", "chrome.exe", edge_args, NULL, SW_SHOWNORMAL);
    if ((INT_PTR)hChrome > 32) {
        return;
    }

    // 3. Fallback to default browser
    ShellExecuteA(NULL, "open", app_url, NULL, NULL, SW_SHOWNORMAL);
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // Create server background thread
    HANDLE hThread = CreateThread(NULL, 0, HttpServerThread, NULL, 0, NULL);
    if (!hThread) {
        MessageBoxA(NULL, "Failed to start IPTV ERD local engine.", "Error", MB_ICONERROR | MB_OK);
        return 1;
    }

    // Launch UI
    LaunchAppWindow();

    // Keep thread alive
    WaitForSingleObject(hThread, INFINITE);
    CloseHandle(hThread);

    return 0;
}
