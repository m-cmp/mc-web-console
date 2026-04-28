# MC Web Console Front

Echo 기반 웹 콘솔 프론트엔드입니다.

## 사전 요구사항

- Go 1.25+
- Node.js 18+
- npm

## 로컬 실행

### 1. 프론트엔드 에셋 빌드

```bash
npm install
npm run build
```

### 2. Go 서버 실행

```bash
go run ./cmd/app/main.go
```

기본 주소: [http://127.0.0.1:3001](http://127.0.0.1:3001)

## 개발 시 에셋 감시

에셋 변경 시 자동 빌드:

```bash
npm run dev
```

별도 터미널에서 Go 서버를 실행하세요.

## Docker 빌드

```bash
docker build -t mc-web-console-front .
docker run -p 3001:3001 mc-web-console-front
```

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| FRONT_ADDR | 0.0.0.0 | 서버 바인드 주소 |
| FRONT_PORT | 3001 | 서버 포트 |
| API_ADDR | localhost | 백엔드 API 주소 |
| API_PORT | 3000 | 백엔드 API 포트 |
