FROM mongo:4.4.7
RUN echo "rs.initiate();" > /docker-entrypoint-initdb.d/replica-init.js
CMD [ "--replSet", "rs" ]

# docker build ./ -t mongodb:4.7-replset

# docker run --name mongodb-replset22 -p 27017:27017 -d mongodb:4.7-replset

# docker ps

# 