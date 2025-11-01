#define _WINSOCK_DEPRECATED_NO_WARNINGS
#include <ctime>
#include <fstream>
#include <iostream>
#include <string>
#include <WinSock2.h>
#include <Ws2tcpip.h>
#include <chrono>
#pragma warning(disable:4996)
#pragma comment(lib, "WS2_32.lib")

using namespace std;

string GetErrorMsgText(int code)
{
	string msgText;

	switch (code)
	{
	case WSAEINTR:				 msgText = "Работа функции прервана\n";						  break;
	case WSAEACCES:				 msgText = "Разрешение отвергнуто\n";						  break;
	case WSAEFAULT:				 msgText = "Ошибочный адрес\n";								  break;
	case WSAEINVAL:				 msgText = "Ошибка в аргументе\n";							  break;
	case WSAEMFILE:				 msgText = "Слишком много файлов открыто\n";				  break;
	case WSAEWOULDBLOCK:		 msgText = "Ресурс временно недоступен\n";					  break;
	case WSAEINPROGRESS:		 msgText = "Операция в процессе развития\n";				  break;
	case WSAEALREADY: 			 msgText = "Операция уже выполняется\n";					  break;
	case WSAENOTSOCK:   		 msgText = "Сокет задан неправильно\n";						  break;
	case WSAEDESTADDRREQ:		 msgText = "Требуется адрес расположения\n";				  break;
	case WSAEMSGSIZE:  			 msgText = "Сообщение слишком длинное\n";				      break;
	case WSAEPROTOTYPE:			 msgText = "Неправильный тип протокола для сокета\n";		  break;
	case WSAENOPROTOOPT:		 msgText = "Ошибка в опции протокола\n";					  break;
	case WSAEPROTONOSUPPORT:	 msgText = "Протокол не поддерживается\n";					  break;
	case WSAESOCKTNOSUPPORT:	 msgText = "Тип сокета не поддерживается\n";				  break;
	case WSAEOPNOTSUPP:			 msgText = "Операция не поддерживается\n";					  break;
	case WSAEPFNOSUPPORT:		 msgText = "Тип протоколов не поддерживается\n";			  break;
	case WSAEAFNOSUPPORT:		 msgText = "Тип адресов не поддерживается протоколом\n";	  break;
	case WSAEADDRINUSE:			 msgText = "Адрес уже используется\n";						  break;
	case WSAEADDRNOTAVAIL:		 msgText = "Запрошенный адрес не может быть использован\n";	  break;
	case WSAENETDOWN:			 msgText = "Сеть отключена\n";								  break;
	case WSAENETUNREACH:		 msgText = "Сеть не достижима\n";							  break;
	case WSAENETRESET:			 msgText = "Сеть разорвала соединение\n";					  break;
	case WSAECONNABORTED:		 msgText = "Программный отказ связи\n";						  break;
	case WSAECONNRESET:			 msgText = "Связь восстановлена\n";							  break;
	case WSAENOBUFS:			 msgText = "Не хватает памяти для буферов\n";				  break;
	case WSAEISCONN:			 msgText = "Сокет уже подключен\n";							  break;
	case WSAENOTCONN:			 msgText = "Сокет не подключен\n";							  break;
	case WSAESHUTDOWN:			 msgText = "Нельзя выполнить send: сокет завершил работу\n";  break;
	case WSAETIMEDOUT:			 msgText = "Закончился отведенный интервал  времени\n";		  break;
	case WSAECONNREFUSED:		 msgText = "Соединение отклонено\n";						  break;
	case WSAEHOSTDOWN:			 msgText = "Хост в неработоспособном состоянии\n";			  break;
	case WSAEHOSTUNREACH:		 msgText = "Нет маршрута для хоста\n";						  break;
	case WSAEPROCLIM:			 msgText = "Слишком много процессов\n";						  break;
	case WSASYSNOTREADY:		 msgText = "Сеть не доступна\n";							  break;
	case WSAVERNOTSUPPORTED:	 msgText = "Данная версия недоступна\n";					  break;
	case WSANOTINITIALISED:		 msgText = "Не выполнена инициализация WS2_32.DLL\n";		  break;
	case WSAEDISCON:			 msgText = "Выполняется отключение\n";						  break;
	case WSATYPE_NOT_FOUND:		 msgText = "Класс не найден\n";								  break;
	case WSAHOST_NOT_FOUND:		 msgText = "Хост не найден\n";								  break;
	case WSATRY_AGAIN:			 msgText = "Неавторизированный хост не найден\n";			  break;
	case WSANO_RECOVERY:		 msgText = "Неопределенная ошибка\n";						  break;
	case WSANO_DATA:			 msgText = "Нет записи запрошенного типа\n";				  break;
	case WSA_INVALID_HANDLE:	 msgText = "Указанный дескриптор события  с ошибкой\n";		  break;
	case WSA_INVALID_PARAMETER:	 msgText = "Один или более параметров с ошибкой\n";			  break;
	case WSA_IO_INCOMPLETE:		 msgText = "Объект ввода-вывода не в сигнальном состоянии\n"; break;
	case WSA_IO_PENDING:		 msgText = "Операция завершится позже\n";					  break;
	case WSA_NOT_ENOUGH_MEMORY:	 msgText = "Не достаточно памяти\n";						  break;
	case WSA_OPERATION_ABORTED:	 msgText = "Операция отвергнута\n";							  break;
	case WSAEINVALIDPROCTABLE:	 msgText = "Ошибочный сервис\n";							  break;
	case WSAEINVALIDPROVIDER:	 msgText = "Ошибка в версии сервиса\n";						  break;
	case WSAEPROVIDERFAILEDINIT: msgText = "Невозможно инициализировать сервис\n";			  break;
	case WSASYSCALLFAILURE:		 msgText = "Аварийное завершение системного вызова\n";		  break;
	default:					 msgText = "Error\n";										  break;
	}

	return msgText;
}

string SetErrorMsgText(const string& msg_text, const int code)
{
	return  msg_text + GetErrorMsgText(code);
}

int main()
{
    setlocale(LC_ALL, "Rus");

    WSADATA wsaData;

    SOCKADDR_IN serv{};
    serv.sin_family = AF_INET;
    serv.sin_port = htons(2000);
    serv.sin_addr.s_addr = inet_addr("127.0.0.1");
    int serv_len = sizeof(serv);

    SOCKADDR_IN clnt{};
    int length_clnt = sizeof(clnt);

    try
    {
        SOCKET cC;
        if (WSAStartup(MAKEWORD(2, 0), &wsaData) != 0)
            throw SetErrorMsgText("Ошибка WSAStartup: ", WSAGetLastError());

        if ((cC = socket(AF_INET, SOCK_DGRAM, NULL)) == INVALID_SOCKET)
            throw SetErrorMsgText("Ошибка в  socket: ", WSAGetLastError());

        cout << "Клиент начал работу." << endl;

        while (true) {
            char ibuf[1024];
            char obuf[1024]{ 'e' }; // entered
            if (sendto(cC, obuf, sizeof obuf, NULL, (sockaddr*)&serv, sizeof(serv)) == SOCKET_ERROR)
                throw SetErrorMsgText("Ошибка в sendto: ", WSAGetLastError());
            if (recvfrom(cC, ibuf, sizeof ibuf, NULL, (sockaddr*)&serv, &serv_len) == SOCKET_ERROR)
                throw SetErrorMsgText("Ошибка в recvfrom: ", WSAGetLastError());

            if (ibuf[0] == 'o') { // open
                cout << "Клиент получил разрешение на доступ\n";
                cout << "Введите название файла: ";
                string filename;
                cin >> filename;
                obuf[0] = 'f';

                strncpy(obuf + 1, filename.c_str(), sizeof(obuf) - 1);
                if (sendto(cC, obuf, sizeof obuf, 0, (sockaddr*)&serv, sizeof(serv)) == SOCKET_ERROR)
                    throw SetErrorMsgText("Ошибка в sendto: ", WSAGetLastError());

                if (recvfrom(cC, ibuf, sizeof ibuf, 0, (sockaddr*)&serv, &serv_len) == SOCKET_ERROR)
                    throw SetErrorMsgText("Ошибка в recvfrom: ", WSAGetLastError());

                if (ibuf[0] == 's') {
                    cout << "Выберите операцию (r - чтение, w - запись): ";
                    char operation;
                    cin >> operation;
                    obuf[0] = operation;
                    if (sendto(cC, obuf, sizeof obuf, 0, (sockaddr*)&serv, sizeof(serv)) == SOCKET_ERROR)
                        throw SetErrorMsgText("Ошибка в sendto: ", WSAGetLastError());

                    if (operation == 'w') {
                        cout << "Введите строку для записи: ";
                        cin.ignore();
                        string text;
                        getline(cin, text);
                        strncpy(obuf + 1, text.c_str(), sizeof(obuf) - 1);
                        if (sendto(cC, obuf, sizeof obuf, 0, (sockaddr*)&serv, sizeof(serv)) == SOCKET_ERROR)
                            throw SetErrorMsgText("Ошибка в sendto: ", WSAGetLastError());
                    }
                    else if (operation == 'r') {
                        if (recvfrom(cC, ibuf, sizeof ibuf, 0, (sockaddr*)&serv, &serv_len) == SOCKET_ERROR)
                            throw SetErrorMsgText("Ошибка в recvfrom: ", WSAGetLastError());
                        cout << "Последние 10 строк:\n" << ibuf << endl;
                    }

                    obuf[0] = 'l'; // leave
                    if (sendto(cC, obuf, sizeof obuf, NULL, (sockaddr*)&serv, sizeof(serv)) == SOCKET_ERROR)
                        throw SetErrorMsgText("Ошибка в sendto: ", WSAGetLastError());
                    if (recvfrom(cC, ibuf, sizeof ibuf, NULL, (sockaddr*)&serv, &serv_len) == SOCKET_ERROR)
                        throw SetErrorMsgText("Ошибка в recvfrom: ", WSAGetLastError());
                    if (ibuf[0] == 'l')

                    cout << "Введите 'c' для выхода или другую клавишу для продолжения: ";
                    char exitCmd;
                    cin >> exitCmd;
                    if (exitCmd == 'c') {
                        obuf[0] = 'q'; 
                        if (sendto(cC, obuf, sizeof obuf, NULL, (sockaddr*)&serv, sizeof(serv)) == SOCKET_ERROR)
                            throw SetErrorMsgText("Ошибка в sendto (выход клиента): ", WSAGetLastError());
                        break; 
                    }
                }
            }
            else if (ibuf[0] == 'w') { 
                cout << "Ожидание завершения работы других клиентов.\n";
                Sleep(2000);
            }
        }

        if (closesocket(cC) == SOCKET_ERROR)
            throw SetErrorMsgText("Ошибка в closesocket: ", WSAGetLastError());

        if (WSACleanup() == SOCKET_ERROR)
            throw SetErrorMsgText("Ошибка в Cleanup: ", WSAGetLastError());
    }
    catch (string ErrorMsg)
    {
        cout << endl << ErrorMsg << endl;
    }

    return 0;
}



