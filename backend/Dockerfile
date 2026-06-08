FROM golang:1.25-alpine AS builder

WORKDIR /app/backend

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /usr/local/bin/siak-backend main.go

FROM alpine:3.22

WORKDIR /app/backend

RUN apk add --no-cache ca-certificates

COPY --from=builder /usr/local/bin/siak-backend /usr/local/bin/siak-backend
COPY --from=builder /app/backend/uploads ./uploads

EXPOSE 8080

CMD ["siak-backend"]