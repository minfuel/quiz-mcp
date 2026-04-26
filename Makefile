.PHONY: help install build test typecheck lint dev clean schema-gen schema-check run-demo run-file run-url

# Default values (override: make run-file QUIZ_FILE=./my.quiz.json OUTPUT_FILE=./answers.json)
QUIZ_FILE ?= ./demo/js-quiz.json
QUIZ_URL ?= https://raw.githubusercontent.com/karerckor/quiz-mcp/main/demo/js-quiz.json
OUTPUT_FILE ?= ./answers.json

help:
	@echo "Available targets:"
	@echo "  make install       Install workspace dependencies"
	@echo "  make build         Build all packages/apps"
	@echo "  make test          Run all tests"
	@echo "  make typecheck     Run TypeScript checks"
	@echo "  make lint          Run lint scripts"
	@echo "  make dev           Run workspace dev mode"
	@echo "  make clean         Clean build outputs"
	@echo "  make schema-gen    Generate schema/quiz.schema.json"
	@echo "  make schema-check  Validate generated schema"
	@echo "  make run-demo      Build runner and run demo quiz from file"
	@echo "  make run-file      Build runner and run local quiz file"
	@echo "  make run-url       Build runner and run remote quiz URL"
	@echo ""
	@echo "Variables for run-file/run-url:"
	@echo "  QUIZ_FILE=$(QUIZ_FILE)"
	@echo "  QUIZ_URL=$(QUIZ_URL)"
	@echo "  OUTPUT_FILE=$(OUTPUT_FILE)"

install:
	pnpm install

build:
	pnpm build

test:
	pnpm test

typecheck:
	pnpm typecheck

lint:
	pnpm lint

dev:
	pnpm build
	pnpm dev

clean:
	pnpm clean

schema-gen:
	pnpm schema:gen

schema-check:
	pnpm schema:check

run-demo:
	$(MAKE) run-file QUIZ_FILE=./demo/js-quiz.json

run-file:
	pnpm --filter @quiz-mcp/runner build
	pnpm --filter @quiz-mcp/runner start -- --file "$(QUIZ_FILE)" --output "$(OUTPUT_FILE)" --open

run-url:
	pnpm --filter @quiz-mcp/runner build
	pnpm --filter @quiz-mcp/runner start -- --url "$(QUIZ_URL)" --output "$(OUTPUT_FILE)" --open
