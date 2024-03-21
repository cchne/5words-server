
## Quickstart

Using Node v20+

```
npm i
npm run start
```
Runs on port `8000` by default

Alternatively. build and run in docker

```
docker build --progress=plain . -t sword-server:latest
docker run -d --name sword-server -p 8000:8000 sword-server
```