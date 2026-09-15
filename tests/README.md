# Passenger flow checks

Use Node.js 24 or later. Install the project dependencies first.

```sh
node tests/geocode.cjs
```

The browser suite needs Playwright and an installed Microsoft Edge browser (or set
`TEST_BROWSER=chrome`). It intercepts all Supabase calls and Mapbox responses, so it
never changes real rides. Set `PLAYWRIGHT_MODULE` to an existing Playwright package
directory if it is not installed in the project.

Build and start the application with these **test-only** environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=https://ride-tests.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test_fixture
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.test_fixture
```

```sh
pnpm build
pnpm start --port 3100
```

Then run with `TEST_MAP=1` (and `TEST_URL` if using a different local port):

```sh
node tests/passenger-flow.cjs
```

Coverage: typed address retention, map point confirmation, booking RPC payload,
all six ride states, restoring an active ride, read failure recovery, per-ride
ratings, terminal dismissal, cancellation, and driver accept/arrive/start/complete.
Screenshots are saved in `test-results/`.

These fixtures verify frontend behavior and API calls. They do not validate live
Mapbox address coverage, Supabase permissions, or realtime publication settings.
Never deploy the build made with these test-only variables; rebuild with the
deployment's configured production variables.
