   M S B A M L   `   `   `  ����A  =lab8_1, Version=1.0.0.0, Culture=neutral, PublicKeyToken=nullclr-namespace:lab8_1lab8_1  5   	       lab8_1.MainWindow   5   	   R NWindowsBase, Version=4.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35\ XPresentationFramework, Version=4.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35W SPresentationCore, Version=4.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35D 9http://schemas.microsoft.com/winfx/2006/xaml/presentation    5   	   R NSystem.Xaml, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089:x,http://schemas.microsoft.com/winfx/2006/xaml     5   	   @d2http://schemas.microsoft.com/expression/blend/2008     5   	   Jmc;http://schemas.openxmlformats.org/markup-compatibility/2006     5   	   &localclr-namespace:lab8_1     5   	   -   5          � Title$  
MainWindow��5   
   $	��700��6   $
��1200��6*   .��5	      � .+�5
   
   �� .@�5      �� $��FileBook��6   .��5      � ���	#FFE5E5E5 � ColumnDefinitions 5      �� 5      $
��133* �6+   �� 5      $��1061* �6+   .+�5      �� -   5         ��Name$ add_btn_filebook��5      $��Добавить��6N   $
��Left=�6a   $��
82,518,0,0q�6|   $	��Top=�6�   $��80��6�   $��20��6�   $��2��6�   �� 5      -   5        $ update_btn_filebook��5      $��Изменить��6T   $
��Left=�6g   $��
51,518,0,0q�6�   $	��Top=�6�   $��80��6�   $��20��6�   $��1��6�   �� 5      -   5        $ delete_btn_filebook��5      $��Удалить��6T   $
��Left=�6f   $��155,518,0,0q�6�   $	��Top=�6�   $��80��6�   $��20��6�   $��1��6�   �� 5      -   5        $ clear_btn_filebook��5      $��Очистить��6Q   $
��Left=�6d   $��157,578,0,0q�6   $	��Top=�6�   $��80��6�   $��20��6�   $��1��6�   &   System.Windows.Controls.DataGrid  5      -   5        $��myDataGridBooks��5   T   -  'System.Windows.Input.KeyboardNavigation   DirectionalNavigation$ 	Contained=�6      
IsReadOnly .    AutoGenerateColumns .  $��365,10,0,-10q�6�   ���	#FFA2D2FF$
��Left=�6  $
��Auto��6(  $��1��65  ��6�   ��    Columns 5      0  *System.Windows.Controls.DataGridTextColumn  5      ,  &System.Windows.Controls.DataGridColumn   Header$ Book_id��61   1  +System.Windows.Controls.DataGridBoundColumn   Binding 6B   �� *	Book_id+  5      $ Title��61    6@   �� *Title+  5      $ Format��61    6A   �� *Format+  5      $ 	File_size��61    6D   �� *	File_size+  5      $	 UDC��61    6>   �� *UDC+  5      $ 
Page_count��61    6E   �� *
Page_count+  5      $ 	Publisher��61    6D   �� *	Publisher+  5      $ Year_published��61    6I   �� *Year_published+  5       $ Upload_date��61    6F   �� *Upload_date+	 �� StringFormat$	 {0:dd MMMM yyyy}��4  .System.Windows.Controls.DataGridTemplateColumn  5!      $ Image��65   
   CellTemplate
 5"   "   �� 5#   &   .R�5$   *   �� $	��100��6N   $��80��6Z   ��60   �� *
Image_path+6Z   5%   '   5'      5*      �� 5+      -   5         ��Name$ SortComboboxBook��5+   :   $��Cascadia Mono)�6   $
��Left=�6U   $��
42,579,0,0q�6p   $	��Top=�6�   $	��120��6�   
������� �� SelectedIndex$ 0��6�   $��10(�6�   $��2��6�   .@�5,      �� $��Book_id��6'   �� 5-      $��Title��6'   �� 5.      $��	File_size��6'   �� 5/      $��	Publisher��6'   �� 50      $��Year_published��6'   �� 51      $��Upload_date��6'   52      �� 54      -   5         ��Name$ title��54      $
��Left=�6-   $��	39,32,0,0q�6H    �� TextWrapping$
 Wrap=�6[   $	��Top=�6p   $	��182��6�   $��27��6�   $��1��6�   �� 55      -	   5        $ format��55      $
��Left=�6/   $��	39,70,0,0q�6J   $
 Wrap=�6]   $	��Top=�6r   $	��182��6�   $��26��6�   $��1��6�   �� 56      -
   5        $ 	file_size��56      $
��Left=�62   $��
39,107,0,0q�6M   $
 Wrap=�6a   $	��Top=�6v   $	��182��6�   $��26��6�   $��1��6�   �� 57      -   5        $	 udc��57      $
��Left=�6,   $��
39,145,0,0q�6G   $
 Wrap=�6[   $	��Top=�6p   $	��182��6�   $��26��6�   $��1��6�   �� 58      -   5        $ 
page_count��58      $
��Left=�63   $��
39,184,0,0q�6N   $
 Wrap=�6b   $	��Top=�6w   $	��182��6�   $��26��6�   $��1��6�   �� 59      -   5        $ 	publisher��59      $
��Left=�62   $��
39,226,0,0q�6M   $
 Wrap=�6a   $	��Top=�6v   $	��182��6�   $��26��6�   $��1��6�   �� 5:      -   5        $ year_published��5:      $
��Left=�67   $��
39,266,0,0q�6R   $
 Wrap=�6f   $	��Top=�6{   $	��182��6�   $��26��6�   $��1��6�   �� 5;      -   5        $ upload_date��5;      $
��Left=�64   $��
39,312,0,0q�6O   $
 Wrap=�6c   $	��Top=�6x   $	��182��6�   $��26��6�   $��1��6�   �� 5<      -   5         ��Name$ image_rectangle��5<       $
��Left=�69   $��67��6T   $��
60,358,0,0q�6`   ���	#FF867F7F$	��Top=�6�   $	��102��6�   
�������$��1��6�   �� 5=      -   5         ��Name$ image��5=      $
��Left=�6+   $��72��6F   $��
60,358,0,0q�6R   $	��Top=�6f   $	��100��6~    J� RenderTransformOrigin$ 0.506,0.521&�6�   $��1��6�   �� 5>      $��Center=�6    $��	0,271,0,0q�6=   $
��Wrap=�6P   $��Год издания��6d   $	��Top=�6w   �� 5?      $
��Left=�6    $��
33,150,0,0q�6;   $
��Wrap=�6O   $��Код УДК��6c   $	��Top=�6r   �� 5@      $
��Left=�6    $��
30,189,0,0q�6;   $
��Wrap=�6O   $ ��Кол-во страниц��6c   $	��Top=�6y   �� 5A      $��Center=�6    $��	0,231,0,0q�6=   $
��Wrap=�6P   $��Издательство��6d   $	��Top=�6x   �� 5B      $
��Left=�6    $��
30,315,0,0q�6;   $
��Wrap=�6O   $��Дата загрузки��6c   $	��Top=�6x   �� 5C      $
��Left=�6    $��
30,363,0,0q�6;   $
��Wrap=�6O   $��Обложка��6c   $	��Top=�6r   �� 5D      $
��Left=�6    $��	30,33,0,0q�6;   $
��Wrap=�6N   $��Название��6b   $	��Top=�6r   �� 5E      $
��Left=�6    $��	30,75,0,0q�6;   $
��Wrap=�6N   $��Формат��6b   $	��Top=�6p   �� 5F      $
��Left=�6    $��
30,112,0,0q�6;   $
��Wrap=�6O   $��Размер(Мб)��6c   $	��Top=�6u   �� 5G      -   5        $��Choose��5G      $
��Left=�6L   $��237,358,0,0q�6g   $	��Top=�6|   $��26��6�   $��43��6�   $��1��6�   �� 5H      -   5        $ SortFlag_book��5H      $
��Left=�6f   $��22��6�   $��
39,579,0,0q�6�   $	��Top=�6�   $��22��6�   $ 0.501,0.464&�6�   $J��DD:\Уник\ООП\Лабы\laba8\картинки\Arrow_Up_Down.png��6�   $��1��6#  �� 5I      -   5        $ nextElement_book��5I      $
��Left=�6o   $��35��6�   $��319,360,0,0q�6�   $	��Top=�6�   $��34��6�   $��1��6�   $F��@D:\Уник\ООП\Лабы\laba8\картинки\Carret_Up.png��6�   �� 5J      -   5        $ previousElement_book��5J      $
��Left=�6w   $��35��6�   $��319,405,0,0q�6�   $	��Top=�6�   $��35��6�   $��1��6�   $H��BD:\Уник\ООП\Лабы\laba8\картинки\Carret_Down.png��6�   5L      5M      �� 5N      $��Author��6   .��5O      � ���	#FFE5E5E5 5P      �� 5Q      $	��77* �6+   �� 5R      $
��520* �6+   .+�5T      �� $
��Left=�6    $��	95,38,0,0q�6;   $
��Wrap=�6N   $��ФИО��6b   $	��Top=�6m   �� 5U      -   5        $ 
authorName��5U      $
��Left=�62   $��	15,30,0,0q�6N   $
 Wrap=�6a   $	��Top=�6v   $	��179��6�   $��30��6�   $��1��6�   �� 5V      $
��Left=�6    $��	95,82,0,0q�6;   $
��Wrap=�6N   $��Страна��6b   $	��Top=�6p   �� 5W      -   5        $ authorCountry��5W      $
��Left=�65   $��	15,80,0,0q�6P   $
 Wrap=�6c   $	��Top=�6w   $	��179��6�   $��30��6�   $��1��6�   �� 5Y      -   5        $ add_btn_author��5Y      $��Добавить��6L   $
��Left=�6_   $��
82,518,0,0q�6z   $	��Top=�6�   $��80��6�   $��20��6�   $��2��6�   �� 5Z      -   5        $ update_btn_author��5Z      $��Изменить��6R   $
��Left=�6e   $��
30,518,0,0q�6�   $	��Top=�6�   $��80��6�   $��20��6�   $��1��6�   �� 5[      -   5        $ delete_btn_author��5[      $��Удалить��6S   $
��Left=�6e   $��134,518,0,0q�6�   $	��Top=�6�   $��80��6�   $��20��6�   $��1��6�   �� 5\      -   5        $ clear_btn_author��5\      $��Очистить��6P   $
��Left=�6c   $��136,578,0,0q�6~   $	��Top=�6�   $��80��6�   $��20��6�   $��1��6�     5]      -   5        $��myDataGridAuthor��5]   T   $ 	Contained=�6    .  .  $��344,10,0,-10q�6�   ���	#FFA2D2FF$
��Left=�6  $	��700��6)  $��1��65  ��6�   ��  5^        5_      $ 	Author_id��61    6D   �� *	Author_id+  5`      $ 	Full_Name��61    6D   �� *	Full_name+  5a      $ Country��61    6B   �� *	Country+5c      �� 5d      -   5        $ SortComboboxAuthor��5d   :   $��Cascadia Mono)�6   $
��Left=�6W   $��
42,579,0,0q�6r   $	��Top=�6�   $	��120��6�   
�������$ 0��6�   $��10(�6�   $��2��6�   .@�5e      �� $��	Author_id��6'   �� 5f      $��	Full_Name��6'   �� 5g      $��Country��6'   5h      �� 5i      -   5        $ SortFlag_author��5i      $
��Left=�6h   $��22��6�   $��
15,576,0,0q�6�   $	��Top=�6�   $��22��6�   $ 0.501,0.464&�6�   $J��DD:\Уник\ООП\Лабы\laba8\картинки\Arrow_Up_Down.png��6�   $��1��6%  �� 5j      -   5        $ nextElement_author��5j      $
��Left=�6q   $��35��6�   $��302,388,0,0q�6�   $	��Top=�6�   $��34��6�   $��1��6�   $F��@D:\Уник\ООП\Лабы\laba8\картинки\Carret_Up.png��6�   $ -0.191,1.252&�6  �� 5k      -    5        $ previousElement_author��5k      $
��Left=�6y   $��35��6�   $��302,422,0,0q�6�   $	��Top=�6�   $��35��6�   $��1��6�   $H��BD:\Уник\ООП\Лабы\laba8\картинки\Carret_Down.png��6�   5m      5n      �� 5o      $��BookAuthors��6   .��5p      � ���	#FFE5E5E5 5q      �� 5r      $	��20* �6+   �� 5s      $	��75* �6+   �� 5t      $��1099* �6+   .+�5v      �� -!   5        $ add_btn_bookauthors��5v      $��Добавить��6Q   $
��Left=�6d   $��
62,518,0,0q�6   $	��Top=�6�   $��80��6�   $��20��6�   $��2��6�   $��1��6�   �� 5w      -"   5        $ update_btn_bookauthors��5w      $��Изменить��6W   $
��Left=�6j   $��
90,518,0,0q�6�   $	��Top=�6�   $��80��6�   $��20��6�   $��2��6�   �� 5x      -#   5        $ delete_btn_bookauthors��5x      $��Удалить��6V   $
��Left=�6h   $��194,518,0,0q�6�   $	��Top=�6�   $��80��6�   $��20��6�   $��2��6�   �� 5y      -$   5        $ clear_btn_bookauthors��5y      $��Очистить��6T   $
��Left=�6g   $��196,578,0,0q�6�   $	��Top=�6�   $��80��6�   $��20��6�   $��2��6�     5z      -%   5        $��myDataGridBookAuthors��5z   T   $ 	Contained=�6    .  .  $��404,10,0,-10q�6�   ���	#FFA2D2FF$
��Left=�6  $	��700��6.  $��2��6:  ��6�   ��  5{        5|      $ BookAuthor_id��61    6H   �� *BookAuthor_id+  5}      $ Book_id��61    6B   �� *	Book_id+  5~      $ 	Author_id��61    6D   �� *	Author_id+5�      �� 5�      -&   5        $ purchases_book_combobox��5�      $
��Left=�6@   $��	70,40,0,0q�6[   $	��Top=�6n   $	��180��6�   $��27��6�   $��2��6�   �� 5�      -'   5        $ purchases_author_combobox��5�      $
��Left=�6B   $��	70,97,0,0q�6]   $	��Top=�6p   $	��180��6�   $��27��6�   $��2��6�   �� 5�      $
��Left=�6    $��	50,43,0,0q�6;   $
��Wrap=�6N   $��
Книга��6b   $	��Top=�6o   $��68��6�   $��26��6�   $ 1.727,0.786&�6�   $��2��6�   $��1��6�   �� 5�      $
��Left=�6    $��
50,100,0,0q�6;   $
��Wrap=�6O   $��
Автор��6c   $	��Top=�6p   $��68��6�   $��26��6�   $ 1.727,0.786&�6�   $��2��6�   $��1��6�   �� 5�      -(   5        $ SortComboboxBooksAuthors��5�   :   $��Cascadia Mono)�6   $
��Left=�6]   $��
38,581,0,0q�6x   $	��Top=�6�   $	��120��6�   
�������$ 0��6�   $��10(�6�   $��2��6�   $��1��6�   .@�5�      �� $��BookAuthor_id��6'   �� 5�      $��Book_id��6'   �� 5�      $��	Author_id��6'   5�      �� 5�      -)   5        $ SortFlag_bookauthors��5�      $
��Left=�6m   $��22��6�   $��
90,579,0,0q�6�   $	��Top=�6�   $��22��6�   $ 0.501,0.464&�6�   $J��DD:\Уник\ООП\Лабы\laba8\картинки\Arrow_Up_Down.png��6�   $��2��6*  �� 5�      -*   5        $ nextElement_bookauthors��5�      $
��Left=�6v   $��35��6�   $��335,338,0,0q�6�   $	��Top=�6�   $��34��6�   $��2��6�   $F��@D:\Уник\ООП\Лабы\laba8\картинки\Carret_Up.png��6�   �� 5�      -+   5        $! previousElement_bookauthors��5�      $
��Left=�6~   $��35��6�   $��334,401,0,0q�6�   $	��Top=�6�   $��35��6�   $��2��6�   $H��BD:\Уник\ООП\Лабы\laba8\картинки\Carret_Down.png��6�   5�      5�      5�      5�      5�      