/**
 * @jest-environment jsdom
 */
import { parseGitLabUrl, getRoleName } from './script';

describe('GitLab Membership Viewer', () => {
    describe('parseGitLabUrl', () => {
        test('extracts base URL and group path from standard URL', () => {
            const input = 'https://gitlab.com/my-org/my-group';
            const expected = {
                baseUrl: 'https://gitlab.com/api/v4/',
                groupPath: 'my-org/my-group'
            };
            expect(parseGitLabUrl(input)).toEqual(expected);
        });

        test('throws error for invalid URL', () => {
            expect(() => parseGitLabUrl('invalid-url')).toThrow('Invalid URL format');
        });
    });

    describe('getRoleName', () => {
        test('returns correct role names for known access levels', () => {
            expect(getRoleName(50)).toBe('Owner');
            expect(getRoleName(40)).toBe('Maintainer');
            expect(getRoleName(30)).toBe('Developer');
            expect(getRoleName(20)).toBe('Reporter');
            expect(getRoleName(15)).toBe('Planner');
            expect(getRoleName(10)).toBe('Guest');
        });

        test('returns the level itself if unknown', () => {
            expect(getRoleName(99)).toBe('99');
        });
    });
});
