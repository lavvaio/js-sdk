prod:
	ng build sdk --prod

test:
	ng test sdk

publish: prod
	cd dist/sdk && npm publish
