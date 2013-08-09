
index.html: lib/connect-firebase.js
	dox \
		--title "Connect Firebase" \
		--desc "Firebase session store for connect backed by the [firebase sdk](https://www.firebase.com/docs/nodejs-quickstart.html)." \
		--ribbon "http://github.com/ca98am79/connect-firebase" \
		$< > $@
