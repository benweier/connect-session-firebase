index.html: lib/connect-session-firebase.js
	dox \
		--title "Connect Session Firebase" \
		--desc "A Connect/Express compatible session store backed by the [Firebase SDK](https://firebase.google.com/docs/server/setup)." \
		--ribbon "https://github.com/benweier/connect-session-firebase" \
		$< > $@
