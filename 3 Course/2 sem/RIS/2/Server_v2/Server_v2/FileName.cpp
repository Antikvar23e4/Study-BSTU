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
#include <vector>
#include <algorithm>
#include <filesystem> 
#include <cstring>


using namespace std;

string GetErrorMsgText(int code)
{
	string msg_text;

	switch (code)
	{
	case WSAEINTR:				 msg_text = "Работа функции прервана\n";						  break;
	case WSAEACCES:				 msg_text = "Разрешение отвергнуто\n";						  break;
	case WSAEFAULT:				 msg_text = "Ошибочный адрес\n";								  break;
	case WSAEINVAL:				 msg_text = "Ошибка в аргументе\n";							  break;
	case WSAEMFILE:				 msg_text = "Слишком много файлов открыто\n";				  break;
	case WSAEWOULDBLOCK:		 msg_text = "Ресурс временно недоступен\n";					  break;
	case WSAEINPROGRESS:		 msg_text = "Операция в процессе развития\n";				  break;
	case WSAEALREADY: 			 msg_text = "Операция уже выполняется\n";					  break;
	case WSAENOTSOCK:   		 msg_text = "Сокет задан неправильно\n";						  break;
	case WSAEDESTADDRREQ:		 msg_text = "Требуется адрес расположения\n";				  break;
	case WSAEMSGSIZE:  			 msg_text = "Сообщение слишком длинное\n";				      break;
	case WSAEPROTOTYPE:			 msg_text = "Неправильный тип протокола для сокета\n";		  break;
	case WSAENOPROTOOPT:		 msg_text = "Ошибка в опции протокола\n";					  break;
	case WSAEPROTONOSUPPORT:	 msg_text = "Протокол не поддерживается\n";					  break;
	case WSAESOCKTNOSUPPORT:	 msg_text = "Тип сокета не поддерживается\n";				  break;
	case WSAEOPNOTSUPP:			 msg_text = "Операция не поддерживается\n";					  break;
	case WSAEPFNOSUPPORT:		 msg_text = "Тип протоколов не поддерживается\n";			  break;
	case WSAEAFNOSUPPORT:		 msg_text = "Тип адресов не поддерживается протоколом\n";	  break;
	case WSAEADDRINUSE:			 msg_text = "Адрес уже используется\n";						  break;
	case WSAEADDRNOTAVAIL:		 msg_text = "Запрошенный адрес не может быть использован\n";	  break;
	case WSAENETDOWN:			 msg_text = "Сеть отключена\n";								  break;
	case WSAENETUNREACH:		 msg_text = "Сеть не достижима\n";							  break;
	case WSAENETRESET:			 msg_text = "Сеть разорвала соединение\n";					  break;
	case WSAECONNABORTED:		 msg_text = "Программный отказ связи\n";						  break;
	case WSAECONNRESET:			 msg_text = "Связь восстановлена\n";							  break;
	case WSAENOBUFS:			 msg_text = "Не хватает памяти для буферов\n";				  break;
	case WSAEISCONN:			 msg_text = "Сокет уже подключен\n";							  break;
	case WSAENOTCONN:			 msg_text = "Сокет не подключен\n";							  break;
	case WSAESHUTDOWN:			 msg_text = "Нельзя выполнить send: сокет завершил работу\n";  break;
	case WSAETIMEDOUT:			 msg_text = "Закончился отведенный интервал  времени\n";		  break;
	case WSAECONNREFUSED:		 msg_text = "Соединение отклонено\n";						  break;
	case WSAEHOSTDOWN:			 msg_text = "Хост в неработоспособном состоянии\n";			  break;
	case WSAEHOSTUNREACH:		 msg_text = "Нет маршрута для хоста\n";						  break;
	case WSAEPROCLIM:			 msg_text = "Слишком много процессов\n";						  break;
	case WSASYSNOTREADY:		 msg_text = "Сеть не доступна\n";							  break;
	case WSAVERNOTSUPPORTED:	 msg_text = "Данная версия недоступна\n";					  break;
	case WSANOTINITIALISED:		 msg_text = "Не выполнена инициализация WS2_32.DLL\n";		  break;
	case WSAEDISCON:			 msg_text = "Выполняется отключение\n";						  break;
	case WSATYPE_NOT_FOUND:		 msg_text = "Класс не найден\n";								  break;
	case WSAHOST_NOT_FOUND:		 msg_text = "Хост не найден\n";								  break;
	case WSATRY_AGAIN:			 msg_text = "Неавторизированный хост не найден\n";			  break;
	case WSANO_RECOVERY:		 msg_text = "Неопределенная ошибка\n";						  break;
	case WSANO_DATA:			 msg_text = "Нет записи запрошенного типа\n";				  break;
	case WSA_INVALID_HANDLE:	 msg_text = "Указанный дескриптор события  с ошибкой\n";		  break;
	case WSA_INVALID_PARAMETER:	 msg_text = "Один или более параметров с ошибкой\n";			  break;
	case WSA_IO_INCOMPLETE:		 msg_text = "Объект ввода-вывода не в сигнальном состоянии\n"; break;
	case WSA_IO_PENDING:		 msg_text = "Операция завершится позже\n";					  break;
	case WSA_NOT_ENOUGH_MEMORY:	 msg_text = "Не достаточно памяти\n";						  break;
	case WSA_OPERATION_ABORTED:	 msg_text = "Операция отвергнута\n";							  break;
	case WSAEINVALIDPROCTABLE:	 msg_text = "Ошибочный сервис\n";							  break;
	case WSAEINVALIDPROVIDER:	 msg_text = "Ошибка в версии сервиса\n";						  break;
	case WSAEPROVIDERFAILEDINIT: msg_text = "Невозможно инициализировать сервис\n";			  break;
	case WSASYSCALLFAILURE:		 msg_text = "Аварийное завершение системного вызова\n";		  break;
	default:					 msg_text = "Error\n";										  break;
	}

	return msg_text;
}

string SetErrorMsgText(const string& msg_text, const int code)
{
	return  msg_text + GetErrorMsgText(code);
}

SOCKET sS;
SOCKADDR_IN server, client;


struct CA {
	char ipaddr[15];
	char resource[20];
	enum STATUS {
		NOINIT = 0,
		INIT,
		ENTER,
		WAIT,
		LEAVE
	} status;
	enum OPERATION {
		NONE = 0,
		READ,
		WRITE
	} operation;
};

CA InitCA(const char ipaddr[15], const char resource[20])
{
	CA ca{};
	memcpy(ca.ipaddr, ipaddr, sizeof(ipaddr));
	memcpy(ca.resource, resource, sizeof(resource));
	ca.status = CA::INIT;

	cout << "Секция инициализирована.\n";
	return ca;
}

bool EnterCA(CA& ca)
{
	string client_ip = inet_ntoa(client.sin_addr);
	cout << "Клиент " << client_ip << ":" << ntohs(client.sin_port)
		<< " запросил доступ к ресурсу";
	if (ca.status == CA::INIT || ca.status == CA::WAIT)
	{
		ca.status = CA::ENTER;
		cout << " - Доступ разрешен.\n";
		return true;
	}
	cout << " - Доступ запрещен.\n";
	return false;
}

bool LeaveCA(CA& ca)
{
	string client_ip = inet_ntoa(client.sin_addr);
	cout << "Клиент " << client_ip << ":" << ntohs(client.sin_port)
		<< " покидает ресурс";
	if (ca.status == CA::ENTER)
	{
		ca.status = CA::WAIT;
		cout << " - Ресурс теперь в режиме ожидания.\n";
		return true;
	}

	cout << " - Клиент не был в ресурсе.\n";
	return false;
}

bool CloseCA(CA& ca)
{
	memset(&ca, 0, sizeof(ca));
	cout << "Секция закрыта.\n";
	return true;
}

vector<string> getLast10Lines(const string& filename) {
	ifstream file(filename);
	vector<string> lines;
	string line;
	while (getline(file, line)) {
		if (lines.size() >= 10) {
			lines.erase(lines.begin());
		}
		lines.push_back(line);
	}
	file.close();
	return lines;
}


int main()
{
	setlocale(LC_ALL, "rus");
	WSADATA wsa_data;

	server.sin_family = AF_INET;
	server.sin_port = htons(2000);
	server.sin_addr.s_addr = INADDR_ANY;

	memset(&client, 0, sizeof(client));
	int length_clnt = sizeof(client);

	bool close = false;
	try
	{
		if (WSAStartup(MAKEWORD(2, 0), &wsa_data) != 0)
			throw SetErrorMsgText("Ошибка в Startup: ", WSAGetLastError());

		if ((sS = socket(AF_INET, SOCK_DGRAM, NULL)) == INVALID_SOCKET)
			throw SetErrorMsgText("Ошибка в socket: ", WSAGetLastError());

		if (bind(sS, (LPSOCKADDR)&server, sizeof(server)) == SOCKET_ERROR)
			throw SetErrorMsgText("Ошибка в bind: ", WSAGetLastError());

		CA ca = InitCA("127.0.0.1", "D:\\RIS\\Text.txt");

		string filename;
		while (true) {
			char input_buffer[1024]{};
			char output_buffer[1024]{};
			
			if (recvfrom(sS, input_buffer, sizeof input_buffer, NULL, (sockaddr*)&client, &length_clnt) == SOCKET_ERROR)
				throw SetErrorMsgText("Ошибка в recvfrom: ", WSAGetLastError());

			if (input_buffer[0] == 'f') {
				filename = string(input_buffer + 1);
				output_buffer[0] = 's';
				if (sendto(sS, output_buffer, sizeof output_buffer, 0, (sockaddr*)&client, sizeof(client)) == SOCKET_ERROR)
					throw SetErrorMsgText("Ошибка в sendto: ", WSAGetLastError());
			}
			else if (input_buffer[0] == 'e' && !close) {
				if (EnterCA(ca)) {
					output_buffer[0] = 'o';
					if (sendto(sS, output_buffer, sizeof output_buffer, NULL, (sockaddr*)&client, sizeof(client)) == SOCKET_ERROR)
						throw SetErrorMsgText("Ошибка в sendto: ", WSAGetLastError());
					close = true;
				}
			}
			else if (input_buffer[0] == 'r' || input_buffer[0] == 'w') {
				ca.operation = (input_buffer[0] == 'r') ? CA::READ : CA::WRITE;

				string basePath = "D:\\University\\2sem\\RIS\\2\\MyStorage\\"; 
				string filename = basePath + string(input_buffer + 1); 

				if (ca.operation == CA::WRITE) {
					cout << "Запись в файл: " << filename << endl;

					ofstream file(filename, ios::app);
					if (!file.is_open()) {
						file.open(filename, ios::out); 
					}

					if (recvfrom(sS, input_buffer, sizeof input_buffer, 0, (sockaddr*)&client, &length_clnt) == SOCKET_ERROR)
						throw SetErrorMsgText("Ошибка в recvfrom (данные для записи): ", WSAGetLastError());

					string text(input_buffer + 1);
					for (int i = 0; i < 10; ++i) {
						file << text << endl;
					}
					file.close();

					cout << "Данные записаны в файл.\n";
				}
				else if (ca.operation == CA::READ) {
					cout << "Чтение из файла: " << filename << endl;

					ifstream file(filename);
					if (!file) {
						cout << "Файл не существует.\n";
						strncpy(output_buffer, "Файл не существует.", sizeof(output_buffer) - 1);
					}
					else {
						vector<string> lastLines;
						string line;
						while (getline(file, line)) {
							if (lastLines.size() >= 10) {
								lastLines.erase(lastLines.begin());
							}
							lastLines.push_back(line);
						}
						file.close();

						string content;
						for (const auto& l : lastLines) {
							content += l + "\n";
						}
						strncpy(output_buffer, content.c_str(), sizeof(output_buffer) - 1);
					}

					if (sendto(sS, output_buffer, sizeof output_buffer, 0, (sockaddr*)&client, sizeof(client)) == SOCKET_ERROR)
						throw SetErrorMsgText("Ошибка в sendto (ответ клиенту): ", WSAGetLastError());
				}
			}
			else if (input_buffer[0] == 'l') {
				if (LeaveCA(ca)) {
					output_buffer[0] = 'l';
					if (sendto(sS, output_buffer, sizeof output_buffer, NULL, (sockaddr*)&client, sizeof(client)) == SOCKET_ERROR)
						throw SetErrorMsgText("Ошибка в sendto: ", WSAGetLastError());
					close = false;
				}
			}
			else if (input_buffer[0] == 'e' && close) {
				output_buffer[0] = 'w';
				if (sendto(sS, output_buffer, sizeof output_buffer, NULL, (sockaddr*)&client, sizeof(client)) == SOCKET_ERROR)
					throw SetErrorMsgText("Ошибка в sendto: ", WSAGetLastError());
				cout << "Отказ в доступе: " << inet_ntoa(client.sin_addr) << ":" << client.sin_port << endl;
			}
			else if (input_buffer[0] == 'q') {
				cout << "Клиент завершил работу. Ресурсы освобождены" << endl;
			}
			if (input_buffer[0] == 'c') break;
		}
		if (closesocket(sS) == SOCKET_ERROR)
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
 