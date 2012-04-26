@echo off
set curpath=%cd%
cd %0\..
If "%1"=="server" node fsobserver\server.js %curpath% %2 
If "%1"=="build" node ..\build.js %2 %3