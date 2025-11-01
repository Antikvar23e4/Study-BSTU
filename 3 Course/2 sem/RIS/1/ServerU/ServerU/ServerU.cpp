#include <iostream>
#include "Winsock2.h"
#include <string>
#include <thread> 
#include <chrono> 
#pragma comment(lib, "WS2_32.lib")
#pragma warning(disable: 4996)

using namespace std;

string GetErrorMsgText(int code) {
    string msgText;
    switch (code) {
    case WSAEINTR:          msgText = "WSAEINTR: Работа функции прервана"; break;
    case WSAEACCES:         msgText = "WSAEACCES: Разрешение отвергнуто"; break;
    case WSAEFAULT:         msgText = "WSAEFAULT: Ошибочный адрес"; break;
    case WSAEINVAL:         msgText = "WSAEINVAL: Ошибка в аргументе"; break;
    case WSAEMFILE:         msgText = "WSAEMFILE: Слишком много файлов открыто"; break;
    case WSAEWOULDBLOCK:    msgText = "WSAEWOULDBLOCK: Ресурс временно недоступен"; break;
    case WSAEINPROGRESS:    msgText = "WSAEINPROGRESS: Операция в процессе развития"; break;
    case WSAEALREADY:       msgText = "WSAEALREADY: Операция уже выполняется"; break;
    case WSAENOTSOCK:       msgText = "WSAENOTSOCK: Сокет задан неправильно"; break;
    case WSAEDESTADDRREQ:   msgText = "WSAEDESTADDRREQ: Требуется адрес расположения"; break;
    case WSAEMSGSIZE:       msgText = "WSAEMSGSIZE: Сообщение слишком длинное"; break;
    case WSAEPROTOTYPE:     msgText = "WSAEPROTOTYPE: Неправильный тип протокола для сокета"; break;
    default:                msgText = "***ERROR***: Unknown error"; break;
    }
    return msgText;
}

string SetErrorMsgText(string msgText, int code) {
    return msgText + " " + GetErrorMsgText(code);
}

struct GETSINCHRO {
    char cmd[4];
    int curvalue;
};

struct SETSINCHRO {
    char cmd[4];
    int correction;
};

int main() {
    setlocale(LC_ALL, "Russian");
    WSADATA wsaData;
    SOCKET sS;
    SOCKADDR_IN servAddr, from;
    char bfrom[50];
    int port = 2000, fromlen = sizeof(from);

    GETSINCHRO getSinchro;
    SETSINCHRO setSinchro;
    int requestCount = 0;
    double avgCorrection = 0.0;
    double totalCorrection = 0.0;
    bool firstRequest = true;

    //  экспоненциальное сглаживание
    double correction2 = 0.0; 
    double totalCorrection2 = 0.0; 
    double avgCorrection2 = 0.0; 
    const double alpha = 0.3; // Коэффициент сглаживания (0.1 - медленно, 0.5 - быстро)


    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        throw "Ошибка при вызове WSAStartup";
    }
    cout << "Winsock библиотека инициализирована." << endl;

    if ((sS = socket(AF_INET, SOCK_DGRAM, 0)) == INVALID_SOCKET) {
        throw "Ошибка при создании сокета";
    }
    cout << "Сокет создан." << endl;

    servAddr.sin_family = AF_INET;
    servAddr.sin_port = htons(port);
    servAddr.sin_addr.s_addr = INADDR_ANY;

    if (bind(sS, (sockaddr*)&servAddr, sizeof(servAddr)) == SOCKET_ERROR) {
        cerr << "Ошибка при привязке сокета: " << WSAGetLastError() << endl;
        closesocket(sS);
        WSACleanup();
        return 1;
    }
    cout << "Сервер запущен на порту " << port << ", ожидает клиентов..." << endl;
    clock_t startTime = clock();

    while (true) {
        int recv_len = recvfrom(sS, (char*)&getSinchro, sizeof(getSinchro), 0, (sockaddr*)&from, &fromlen);
        if (recv_len == SOCKET_ERROR) {
            cerr << "Ошибка при получении сообщения (recvfrom): " << WSAGetLastError() << endl;
            continue;
        }

        // Получаем текущее время сервера
        int Cs = (clock() - startTime) * 1000 / CLOCKS_PER_SEC;//1000 / CLOCKS_PER_SEC - mc
        int correction = Cs - getSinchro.curvalue;

        
        if (strcmp(getSinchro.cmd, "SET") == 0) {
            cout << "========================================" << endl;
            cout << "[INIT] Запрос от клиента" << endl;
            cout << "IP клиента: " << inet_ntoa(from.sin_addr) << endl;
            cout << "Текущее время (curvalue): " << getSinchro.curvalue << endl;
            cout << "Вычисленная коррекция: " << correction << endl;
        }
        else {
            if (firstRequest) {
                firstRequest = false;  
                cout << "----------------------------------------" << endl;
                cout << "Запрос #1 (не учитывается в средней коррекции)" << endl;
                cout << "IP клиента: " << inet_ntoa(from.sin_addr) << endl;
                cout << "Текущее время (curvalue): " << getSinchro.curvalue << endl;
                cout << "Вычисленная коррекция: " << correction << endl;
                cout << "----------------------------------------" << endl;
            }
            else {
                requestCount++;
                totalCorrection += correction;
                avgCorrection = totalCorrection / requestCount;

                if (requestCount == 1) {
                    correction2 = correction;
                }
                else {//
                    correction2 = alpha * correction + (1 - alpha) * correction2;
                }

                totalCorrection2 += correction2;
                avgCorrection2 = totalCorrection2 / requestCount;

                cout << "----------------------------------------" << endl;
                cout << "Запрос #" << requestCount + 1 << " от клиента" << endl;
                cout << "IP клиента: " << inet_ntoa(from.sin_addr) << endl;
                cout << "Текущее время (curvalue): " << getSinchro.curvalue << endl;
                cout << "Вычисленная коррекция: " << correction << endl;
                cout << "Коррекция (экспоненциальное сглаживание): " << correction2 << endl;
                cout << "Средняя коррекция: " << avgCorrection << endl;
                cout << "Средняя сглаженная коррекция : " << avgCorrection2 << endl;
                cout << "----------------------------------------" << endl;
            }
        }

        strcpy(setSinchro.cmd, "ACK");
        setSinchro.correction = correction; //

        if (sendto(sS, (char*)&setSinchro, sizeof(setSinchro), 0, (sockaddr*)&from, fromlen) == SOCKET_ERROR) {
            cerr << "Ошибка при отправке ответа: " << WSAGetLastError() << endl;
        }
    }

    closesocket(sS);
    WSACleanup();
    return 0;
}