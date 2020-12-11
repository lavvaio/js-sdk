.PHONY: prod
prod:
	ng build sdk --prod && cd dist/sdk && npm pack

.PHONY: pack
pack: prod

test:
	ng test sdk --no-watch --no-progress --browsers=ChromeHeadlessCI --code-coverage

publish: prod
	cd dist/sdk && npm publish
