FROM golang:1.25
RUN apt-get update && apt-get install -y libwebp-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY . .


# Download dependecies without installing -d and showing details -v
RUN go get -d -v ./...

#  Build file with name api
RUN go build  -o exec .

EXPOSE 8100

CMD [ "./exec"]