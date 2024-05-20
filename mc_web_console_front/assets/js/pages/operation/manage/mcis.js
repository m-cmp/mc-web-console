import { TabulatorFull as Tabulator } from 'tabulator-tables';

let tabledata = [
	{id:1, name:"Oli Bob", age:"12", col:"red", dob:""},
	{id:2, name:"Mary May", age:"1", col:"blue", dob:"14/05/1982"},
	{id:3, name:"Christine Lobowski", age:"42", col:"green", dob:"22/05/1982"},
	{id:4, name:"Brendon Philips", age:"125", col:"orange", dob:"01/08/1980"},
	{id:5, name:"Margret Marmajuke", age:"16", col:"yellow", dob:"31/01/1999"},
	{id:5, name:"Margret 1", age:"16", col:"yellow", dob:"31/01/1999"},
];

//create Tabulator on DOM element with id "example-table"
let table = new Tabulator("#mcislist-table", {
	data: tabledata, //assign data to table
	layout:"fitColumns",
    resizableColumnFit:true,
	
	pagination:"local",
    paginationSize:6,
    paginationSizeSelector:[3, 6, 8, 10],
    movableColumns:true,
    paginationCounter:"rows",

	columns:[ //Define Table Columns
		{title:"Status", field:"status"},
		{title:"Name", field:"name"},
		{title:"Provider", field:"provider"},
		{title:"Total Infras", field:"Total_Infras"},
		{title:"# of Servers", field:"# of Servers"},
		],
	
});