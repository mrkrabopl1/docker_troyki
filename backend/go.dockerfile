FROM golang:1.25

WORKDIR /app

COPY . .


# Download dependecies without installing -d and showing details -v
RUN go get -d -v ./...

#  Build file with name api
RUN go build  -o exec .

EXPOSE 8100

CMD [ "./exec"]