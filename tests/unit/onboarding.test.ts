import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contactSchema, onboardingActionSchema, deliveryMessage} from '../../src/lib/onboarding.ts';
import {qrPoster} from '../../src/lib/qr-poster.ts';
test('contact email is validated and normalized without admitting arbitrary actions',()=>{
  assert.equal(contactSchema.parse({contact_name:' María ',email:'Maria@Example.com',phone:''}).email,'maria@example.com');
  assert.equal(contactSchema.safeParse({contact_name:'Maria',email:'invalid',phone:''}).success,false);
  assert.equal(onboardingActionSchema.safeParse({action:'make_admin',email:'x@example.com'}).success,false);
  assert.equal(onboardingActionSchema.safeParse({action:'revoke',user_id:'not-a-uuid'}).success,false);
});
test('printed poster escapes restaurant content and refuses CSS injection',()=>{
  const svg=qrPoster('<script>alert(1)</script>','red" onload="evil','https://example.com/r/a?x=1&y=2','<svg viewBox="0 0 21 21"><path d="M0 0"/></svg>');
  assert.ok(!svg.includes('<script>'));assert.ok(!svg.includes('onload='));assert.ok(svg.includes('&lt;script&gt;'));assert.ok(svg.includes('x=1&amp;y=2'));
});
test('public delivery message does not contain an activation token',()=>{
  const text=deliveryMessage('BRASA','https://example.com/r/brasa','https://example.com/acceso');
  assert.ok(text.includes('/r/brasa'));assert.ok(text.includes('/acceso'));assert.ok(!text.includes('token_hash='));
});
