# Para instalar el backend
## Desde la raiz: 
* python3 -m venv venv
* .\venv\Scripts\Activate.ps1 # al menos el windows
* pip install uvicorn

## Desde /backend
* pip install numpy
* pip install pip install opencv-python
* pip install fastapi
* pip install av
* pip install ultralytics
* pip install python-multipath #si te lo pide

# para ejecutar el Backend
* .\venv\Scripts\Activate.ps1 #siempre que se reinicie
* uvicorn app.main:app --port 8001 --reload


# Para instalar el frontend
## en /frontend/mi-app
* npm install

# Para ejecutar el frontend
## en /frontend/mi-app/src
* npm run dev