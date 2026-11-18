<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * POST /api/coordinator/meetings: a meeting link is required (http/https)
 * for Online meetings and never stored for Offline ones.
 */
class CoordinatorMeetingLinkTest extends TestCase
{
    private ?int $coordinatorId = null;
    private array $auth = [];

    protected function setUp(): void
    {
        parent::setUp();

        $email = 'meetingtest_' . uniqid() . '@rajagiri.edu';
        $this->coordinatorId = DB::table('users')->insertGetId([
            'name' => 'Meeting Test Coordinator',
            'email' => $email,
            'password' => Hash::make('meetpass123'),
            'role' => 'coordinator',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = $this->postJson('/api/auth/login', ['email' => $email, 'password' => 'meetpass123'])
            ->assertStatus(200)->json('access_token');
        $this->auth = ['Authorization' => 'Bearer ' . $token];
    }

    protected function tearDown(): void
    {
        if ($this->coordinatorId) {
            DB::table('meetings')->where('created_by', $this->coordinatorId)->delete();
            DB::table('users')->where('id', $this->coordinatorId)->delete();
        }
        parent::tearDown();
    }

    private function schedule(array $overrides)
    {
        return $this->withHeaders($this->auth)->postJson('/api/coordinator/meetings', array_merge([
            'title' => 'Link test ' . uniqid(),
            'date' => now()->addDay()->toDateString(),
            'time' => '10:00',
        ], $overrides));
    }

    public function test_online_meeting_does_not_require_a_link(): void
    {
        $this->schedule(['mode' => 'Online'])->assertStatus(201);
        $this->schedule(['mode' => 'Online', 'meeting_link' => ''])->assertStatus(201);
    }

    public function test_online_meeting_link_must_be_http_or_https(): void
    {
        foreach (['not a url', 'ftp://files.example.com/meet', 'javascript:alert(1)'] as $bad) {
            $this->schedule(['mode' => 'Online', 'meeting_link' => $bad])
                ->assertStatus(422)->assertJsonValidationErrors('meeting_link');
        }
    }

    public function test_online_meeting_link_is_saved_and_listed(): void
    {
        $link = 'https://meet.google.com/abc-defg-hij';
        $id = $this->schedule(['mode' => 'Online', 'meeting_link' => $link])->assertStatus(201)->json('data.id');

        $this->assertSame($link, DB::table('meetings')->where('id', $id)->value('meeting_link'));

        $listed = collect($this->withHeaders($this->auth)->getJson('/api/coordinator/meetings')->assertStatus(200)->json('data'))
            ->firstWhere('id', $id);
        $this->assertSame($link, $listed['meeting_link']);
    }

    public function test_offline_meeting_ignores_any_stale_link(): void
    {
        $id = $this->schedule(['mode' => 'Offline', 'location' => 'Room 204', 'meeting_link' => 'leftover text'])
            ->assertStatus(201)->json('data.id');

        $row = DB::table('meetings')->where('id', $id)->first();
        $this->assertNull($row->meeting_link);
        $this->assertSame('Room 204', $row->location);
    }

    public function test_offline_meeting_does_not_require_a_link(): void
    {
        $this->schedule(['mode' => 'Offline'])->assertStatus(201);
    }
}
