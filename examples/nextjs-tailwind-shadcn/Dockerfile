FROM node:22.14-slim

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
COPY packages ./packages
COPY examples/nextjs-tailwind-shadcn ./examples/nextjs-tailwind-shadcn

# Install dependencies
RUN pnpm install

# Build the project
WORKDIR /app/examples/nextjs-tailwind-shadcn
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
