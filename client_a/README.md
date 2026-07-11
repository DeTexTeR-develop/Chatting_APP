# client_a — Angular frontend

Angular 17 rewrite of the React client. Connects to the same Express/Socket.IO backend.

## Setup

```bash
cd client_a
npm install
npm start        # runs on http://localhost:4200
```

The dev server proxies all API and socket requests to `http://localhost:8002` via `proxy.conf.json`.

## Features

- Login / Signup
- Conversations list with real-time online presence dots
- Real-time chat (Socket.IO)
- User directory
- User profile with edit (own) and delete (admin)
- Black & white minimal theme

## Structure

```
src/app/
  core/
    models/       api.models.ts
    services/     auth, user, chat, socket
    guards/       auth, publicOnly
  pages/          login, signup, dashboard, conversations, chat, user-profile
  shared/
    components/   navbar
  layout/         shell with navbar + router-outlet
```
