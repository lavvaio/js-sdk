pack:
	ng build sdk --prod && cd dist/sdk && npm pack

test:
	ng test sdk

publish: prod
	cd dist/sdk && npm publish
