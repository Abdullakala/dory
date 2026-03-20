import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getActiveOrganizationIdFromSession,
    getLegacyDefaultTeamIdFromSession,
    resolveCurrentOrganizationId,
} from '../../lib/auth/current-organization';

test('resolveCurrentOrganizationId prefers active organization over legacy default team', () => {
    const session = {
        session: { activeOrganizationId: 'org_active' },
        user: { defaultTeamId: 'team_legacy' },
    } as any;

    assert.equal(resolveCurrentOrganizationId(session), 'org_active');
    assert.equal(getActiveOrganizationIdFromSession(session), 'org_active');
    assert.equal(getLegacyDefaultTeamIdFromSession(session), 'team_legacy');
});

test('resolveCurrentOrganizationId falls back to legacy default team when needed', () => {
    const session = {
        session: { activeOrganizationId: null },
        user: { defaultTeamId: 'team_legacy' },
    } as any;

    assert.equal(resolveCurrentOrganizationId(session), 'team_legacy');
});

test('resolveCurrentOrganizationId returns null when neither source is present', () => {
    assert.equal(resolveCurrentOrganizationId(null), null);
    assert.equal(resolveCurrentOrganizationId({ session: {}, user: {} } as any), null);
});
