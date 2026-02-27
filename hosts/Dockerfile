FROM node:20-alpine

WORKDIR /app

# Install common dependencies at /app root so all CLIs can resolve them
COPY common/package.json ./
RUN npm install

# Copy common source
COPY common/src/ ./common/src/

# Copy all host apps
COPY despacho/ ./despacho/
COPY mostrador/ ./mostrador/
COPY atencion/ ./atencion/
COPY admin/ ./admin/

# Entrypoint resolves which CLI to run based on HOST_ROLE env var
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]

