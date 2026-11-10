# Vibeslide production image.
#
# Base image ships Node 20, Chromium, and all system libraries required by
# Playwright. The version tag must match the `playwright` version resolved in
# package-lock.json (check with: npm ls playwright).
FROM mcr.microsoft.com/playwright:v1.61.1-noble

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    DATABASE_PATH=/app/data/vibeslide.db \
    DATA_DIRECTORY=/app/data

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

VOLUME ["/app/data"]
EXPOSE 3000

# Railway and most PaaS providers inject PORT; fall back to 3000 for compose.
ENV PORT=3000
CMD ["sh", "-c", "npm start -- -p ${PORT:-3000}"]
