import { isValidParkingSessionId, resolveDimoAuthRedirectPath } from './dimoAuthRedirect';

describe('resolveDimoAuthRedirectPath', () => {
  const validSession = '550e8400-e29b-41d4-a716-446655440000';

  it('defaults when param missing or empty', () => {
    expect(resolveDimoAuthRedirectPath(null)).toBe('/dashboard');
    expect(resolveDimoAuthRedirectPath('')).toBe('/dashboard');
    expect(resolveDimoAuthRedirectPath('   ')).toBe('/dashboard');
  });

  it('allows allowlisted parking session path', () => {
    expect(resolveDimoAuthRedirectPath(`/parking/sessions/${validSession}`)).toBe(
      `/parking/sessions/${validSession}`,
    );
    expect(resolveDimoAuthRedirectPath(encodeURIComponent(`/parking/sessions/${validSession}`))).toBe(
      `/parking/sessions/${validSession}`,
    );
  });

  it('rejects open redirects and non-allowlisted paths', () => {
    expect(resolveDimoAuthRedirectPath('//evil.com')).toBe('/dashboard');
    expect(resolveDimoAuthRedirectPath('https://evil.com')).toBe('/dashboard');
    expect(resolveDimoAuthRedirectPath('/parking/sessions/not-a-uuid')).toBe('/dashboard');
    expect(resolveDimoAuthRedirectPath(`/parking/sessions/${validSession}/extra`)).toBe('/dashboard');
    expect(resolveDimoAuthRedirectPath('/parking')).toBe('/dashboard');
    expect(resolveDimoAuthRedirectPath(`/parking/sessions/${validSession}?x=1`)).toBe('/dashboard');
    expect(resolveDimoAuthRedirectPath('/dashboard')).toBe('/dashboard');
    expect(resolveDimoAuthRedirectPath('/recovery')).toBe('/dashboard');
  });
});

describe('isValidParkingSessionId', () => {
  it('accepts UUID-shaped ids', () => {
    expect(isValidParkingSessionId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('rejects invalid ids', () => {
    expect(isValidParkingSessionId('not-a-uuid')).toBe(false);
    expect(isValidParkingSessionId('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
  });
});
