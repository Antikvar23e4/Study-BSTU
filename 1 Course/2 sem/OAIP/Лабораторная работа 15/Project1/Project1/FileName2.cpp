#include "Hash.h"
#include <iostream>
using namespace std;
struct AAA
{
	int key;
	char* mas;
	AAA(int k, char* z)
	{
		key = k;  mas = z;
	} AAA() {}
};
//-------------------------------
int key(void* d)
{
	AAA* f = (AAA*)d;   return f->key;
}
//-------------------------------
void AAA_print(void* d)
{
	cout << " ���� " << ((AAA*)d)->key << " - " << ((AAA*)d)->mas << endl;
}
//-------------------------------
int main(int argc, char* argv[])
{
	setlocale(LC_ALL, "rus");
	AAA a1(1, const_cast<char*>("one")), a2(2, const_cast<char*>("two")), a3(3, const_cast<char*>("three")), a4(4, const_cast<char*>("fo"));
	int siz = 10, choice, k;
	cout << "������� ������ ���-�������" << endl; 	cin >> siz;
	Object H = create(siz, key);
	for (;;)
	{
		cout << "1 - ����� ���-�������" << endl;
		cout << "2 - ���������� ��������" << endl;
		cout << "3 - �������� ��������" << endl;
		cout << "4 - ����� ��������" << endl;
		cout << "0 - �����" << endl;
		cout << "�������� �����" << endl;   cin >> choice;
		switch (choice)
		{
		case 0:  exit(0);
		case 1: H.scan(AAA_print);  break;
		case 2: { AAA* a = new AAA;
			char* str = new char[20];
			cout << "������� ����" << endl;	cin >> k;
			a->key = k;
			cout << "������� ������" << endl; cin >> str;
			a->mas = str;
			if (H.N == H.size)
				cout << "������� ���������" << endl;
			else
				H.insert(a);
			H.CompareCollisions(H, k, a);
		} break;
		case 3: {  cout << "������� ���� ��� ��������" << endl;
			cin >> k;
			H.deleteByKey(k);
		}  break;
		case 4: {  cout << "������� ���� ��� ������" << endl;
			cin >> k;
			if (H.search(k) == NULL)
				cout << "������� �� ������" << endl;
			else
				AAA_print(H.search(k));
		}  break;
		}
	}
	return 0;
}
