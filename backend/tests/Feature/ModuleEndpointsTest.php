<?php

namespace Tests\Feature;

use Tests\TestCase;

class ModuleEndpointsTest extends TestCase
{
    public function test_coordinator_projects_route_requires_authentication(): void
    {
        $response = $this->get('/api/coordinator/projects');

        $response->assertStatus(401);
    }

    public function test_certificates_route_requires_authentication(): void
    {
        $response = $this->get('/api/certificates');

        $response->assertStatus(401);
    }
}
