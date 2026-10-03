# First administrator setup

Customer roles are stored in `public.profiles.role`. New Auth users receive a
profile through `public.handle_new_user()` and default to the `customer` role.
Public registration does not accept a role.

## Promote the first administrator

1. Register the administrator account through the normal storefront registration
   flow. Do not add an admin-registration endpoint or put a service-role key in
   the frontend.
2. In the Supabase Dashboard, open **Authentication → Users** and copy the
   account's Auth user UUID. Confirm that its matching profile exists:

   ```sql
   SELECT id, full_name, role
   FROM public.profiles
   WHERE id = 'PASTE_EXISTING_AUTH_USER_UUID_HERE'::uuid;
   ```

3. As a trusted operator, run this statement in the Dashboard SQL Editor after
   replacing the placeholder with that one user's UUID:

   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = 'PASTE_EXISTING_AUTH_USER_UUID_HERE'::uuid
     AND role = 'customer'
   RETURNING id, full_name, role;
   ```

   The profile primary key limits the update to one specific user; the role
   predicate prevents modifying profiles that are not customers. Confirm that
   exactly one row is returned. Zero rows means the profile is absent or is no
   longer a customer; verify the UUID before taking further action.

The self-update RLS policy requires the updated role to equal the caller's
current role, so a customer session cannot promote itself. Only a trusted
operator using the Supabase Dashboard SQL Editor should run the promotion.

## Admin authorization flow

1. The backend receives an authenticated request with a Supabase access token.
2. `createRequireAuth` verifies the token with Supabase Auth and attaches the
   verified user to the request.
3. `createRequireAdmin` looks up that verified user's `public.profiles.role`
   through the backend database service and allows the request only when the
   role is `admin`.
4. Missing/invalid authentication is rejected with HTTP 401; an authenticated
   non-admin is rejected with HTTP 403.

Future admin routes should reuse both middleware functions in this order:
`createRequireAuth()` followed by `createRequireAdmin(isAdmin)`. Never trust
role information supplied by the browser. The frontend role check only gates
navigation; backend checks remain authoritative.

After promotion, sign out and sign in again or refresh the storefront. The
frontend reloads the profile role under the authenticated user's own-profile
RLS policy. Additional administrators should be promoted by a trusted operator
with the same targeted SQL procedure until a separately reviewed admin-only
role-management feature is implemented.
