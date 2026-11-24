<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DesignModuleSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Seed or update design_user_profiles
        // Design Head (ID 17 & 18)
        $designHeadId = DB::table('users')->where('email', 'designhead@rajagiri.edu')->value('id') ?? 17;

        $designProfiles = [
            [
                'user_id' => 17,
                'user_id' => $designHeadId,
                'division' => 'design',
                'skill_tags' => json_encode(['UI', 'Branding', 'Direction', 'Motion', 'Poster']),
                'weekly_capacity_hours' => 30,
                'is_active' => true,
                'notification_preferences' => json_encode(['email' => true, 'in_app' => true, 'daily_digest' => true]),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Designer Students: Student Nova (6), Student Orbit (7), Student Spark (8)
            [
                'user_id' => 6,
                'division' => 'design',
                'skill_tags' => json_encode(['poster', 'illustration', 'UI']),
                'weekly_capacity_hours' => 20,
                'is_active' => true,
                'notification_preferences' => json_encode(['email' => true, 'in_app' => true]),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 7,
                'division' => 'design',
                'skill_tags' => json_encode(['video edit', 'motion', 'social creative']),
                'weekly_capacity_hours' => 18,
                'is_active' => true,
                'notification_preferences' => json_encode(['email' => true, 'in_app' => true]),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 8,
                'division' => 'design',
                'skill_tags' => json_encode(['UI', 'presentation', 'poster']),
                'weekly_capacity_hours' => 22,
                'is_active' => true,
                'notification_preferences' => json_encode(['email' => true, 'in_app' => true]),
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($designProfiles as $profile) {
            DB::table('design_user_profiles')->updateOrInsert(
                ['user_id' => $profile['user_id']],
                $profile
            );
        }

        // Clean existing test tickets if any with FK disabled
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('design_notifications')->truncate();
        DB::table('design_audit_logs')->truncate();
        DB::table('design_assets')->truncate();
        DB::table('design_comments')->truncate();
        DB::table('design_versions')->truncate();
        DB::table('design_tickets')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 2. Seed Realistic Tickets covering all 10 states from PDF
        // States: New, Assigned, In Progress, Submitted, In Review, Revision, Approved, Closed, On Hold, Cancelled
        $tickets = [
            [
                'ticket_number' => 'DSN-2026-0142',
                'work_type' => 'poster',
                'title' => 'International AI-Ops Symposium 2026 Keynote Poster',
                'purpose' => 'Promotional flagship poster for college notice boards and social digital broadcast.',
                'requester_id' => 3, // Coordinator
                'requesting_division' => 'teaching',
                'target_audience' => 'Engineering Students & International Researchers',
                'publishing_channel' => 'Print & Digital Billboard',
                'required_by' => $now->copy()->addDays(5)->setTime(18, 0),
                'committed_delivery_date' => $now->copy()->addDays(6)->setTime(17, 0),
                'priority' => 'urgent',
                'final_copy' => "RAJAGIRI LABZ PRESENTS\nGLOBAL AI-OPS SUMMIT 2026\nKeynote Address: Scaling Enterprise LLMs & Resilient Systems\nDate: November 24th, 2026 | Rajagiri Auditorium\nRegistration Link: rlabz.rajagiri.edu/summit",
                'reference_links' => 'https://dribbble.com/shots/futuristic-tech-conference-poster',
                'attachments' => json_encode(['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800']),
                'brand_constraints' => 'Must use Rajagiri Royal Emerald (#059669) and Slate #0f172a. Do not alter crest logo ratio.',
                'type_specific_fields' => json_encode([
                    'dimensions' => 'A2 (420 x 594 mm)',
                    'format' => 'print',
                    'bleed_dpi' => '3mm bleed, 300 DPI CMYK',
                    'orientation' => 'Portrait',
                    'variants_count' => 2,
                ]),
                'status' => 'In Progress',
                'ball_is_with' => 'Designer',
                'assigned_to' => 6, // Student Nova
                'collaborators' => json_encode([8]),
                'estimated_hours' => 12.0,
                'actual_hours_logged' => 7.5,
                'revision_count' => 1,
                'created_at' => $now->copy()->subDays(3),
                'updated_at' => $now->copy()->subHours(2),
            ],
            [
                'ticket_number' => 'DSN-2026-0143',
                'work_type' => 'social_creative',
                'title' => 'Student Innovation Incubator Showcase Carousel',
                'purpose' => 'Multi-slide Instagram and LinkedIn carousel highlighting 5 winning student IoT prototypes.',
                'requester_id' => 5, // Faculty Member
                'requesting_division' => 'training',
                'target_audience' => 'Alumni, prospective tech leads & students',
                'publishing_channel' => 'Instagram & LinkedIn',
                'required_by' => $now->copy()->addDays(3)->setTime(14, 0),
                'committed_delivery_date' => $now->copy()->addDays(3)->setTime(12, 0),
                'priority' => 'high',
                'final_copy' => "Slide 1: Meet the 5 breakthrough student innovations from Rajagiri RLabZ.\nSlide 2: Smart Campus IoT Telemetry...\nSlide 3: Autonomous Kiosk System...",
                'reference_links' => 'https://www.instagram.com/p/design-carousel-inspiration',
                'attachments' => json_encode(['https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800']),
                'brand_constraints' => 'Include RLabZ verified badge watermark on upper-right corner.',
                'type_specific_fields' => json_encode([
                    'platforms' => ['Instagram', 'LinkedIn'],
                    'creative_type' => 'carousel',
                    'slides_count' => 6,
                    'caption_text' => 'Transforming classroom theory into production-ready software. Discover how our students engineer the future at RLabZ. #Innovation #RLabZ #Engineering',
                ]),
                'status' => 'In Review',
                'ball_is_with' => 'Requester',
                'assigned_to' => 7, // Student Orbit
                'collaborators' => null,
                'estimated_hours' => 8.0,
                'actual_hours_logged' => 8.0,
                'revision_count' => 1,
                'created_at' => $now->copy()->subDays(4),
                'updated_at' => $now->copy()->subHours(4),
            ],
            [
                'ticket_number' => 'DSN-2026-0144',
                'work_type' => 'video_motion',
                'title' => 'RLabZ ERP Feature Launch Teaser Reel',
                'purpose' => 'High-tempo 45-second promo reel for social announcement of the new ERP Design Studio.',
                'requester_id' => 17, // Design Head
                'requesting_division' => 'design',
                'target_audience' => 'College community & tech recruiters',
                'publishing_channel' => 'YouTube Shorts & Instagram Reels',
                'required_by' => $now->copy()->addDays(7)->setTime(17, 0),
                'committed_delivery_date' => $now->copy()->addDays(7)->setTime(16, 0),
                'priority' => 'high',
                'final_copy' => "Empowering students to build world-class enterprise software. The all-new RLabZ ERP is live.",
                'reference_links' => 'https://youtube.com/shorts/fast-motion-design-teaser',
                'attachments' => json_encode(['https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-41364-large.mp4']),
                'brand_constraints' => 'High energy, electronic ambient synth audio track, subtitles burnt-in.',
                'type_specific_fields' => json_encode([
                    'target_duration' => '45 seconds',
                    'aspect_ratio' => '9:16 Vertical',
                    'raw_footage_links' => 'https://drive.google.com/drive/folders/rlabz-raw-footage',
                    'voiceover_subtitles' => 'Burnt-in English subtitles with bold keyword pops',
                    'music_preference' => 'Upbeat Cyber Ambient Tech',
                    'captions_language' => 'English',
                ]),
                'status' => 'Submitted',
                'ball_is_with' => 'Requester',
                'assigned_to' => 7, // Student Orbit
                'collaborators' => json_encode([6]),
                'estimated_hours' => 16.0,
                'actual_hours_logged' => 15.0,
                'revision_count' => 0,
                'created_at' => $now->copy()->subDays(2),
                'updated_at' => $now->copy()->subHours(1),
            ],
            [
                'ticket_number' => 'DSN-2026-0145',
                'work_type' => 'presentation',
                'title' => 'Industry Advisory Board Pitch Deck 2026',
                'purpose' => 'Quarterly advisory review presentation showcasing funded project milestones.',
                'requester_id' => 1, // Director Office
                'requesting_division' => 'teaching',
                'target_audience' => 'Corporate Executive Board Members',
                'publishing_channel' => 'Live Keynote & PDF Leave-behind',
                'required_by' => $now->copy()->addDays(4)->setTime(10, 0),
                'committed_delivery_date' => $now->copy()->addDays(4)->setTime(9, 30),
                'priority' => 'urgent',
                'final_copy' => "Slide outline: Executive Overview -> Project Milestones -> Financial Health -> Next Horizon Initiatives.",
                'reference_links' => 'https://pitch.com/templates/executive-advisory-board',
                'attachments' => json_encode(['https://files.rajagiri.edu/docs/q3-performance-summary.docx']),
                'brand_constraints' => 'Executive typography (Plus Jakarta Sans + Garamond serif quotes). Minimalist layout.',
                'type_specific_fields' => json_encode([
                    'slide_count' => 24,
                    'build_method' => 'From Scratch',
                    'source_doc' => 'Q3-Advisory-Raw-Notes-v2.docx',
                ]),
                'status' => 'Revision',
                'ball_is_with' => 'Designer',
                'assigned_to' => 8, // Student Spark
                'collaborators' => null,
                'estimated_hours' => 10.0,
                'actual_hours_logged' => 9.0,
                'revision_count' => 2,
                'created_at' => $now->copy()->subDays(5),
                'updated_at' => $now->copy()->subHours(3),
            ],
            [
                'ticket_number' => 'DSN-2026-0146',
                'work_type' => 'poster',
                'title' => 'National Hackathon 2026 Campus Rollup Banners',
                'purpose' => 'Entry hall vertical retractable standee banners for college foyer.',
                'requester_id' => 3, // Coordinator
                'requesting_division' => 'training',
                'target_audience' => 'Hackathon participants & visitors',
                'publishing_channel' => 'Print Standees',
                'required_by' => $now->copy()->subDays(1)->setTime(16, 0),
                'committed_delivery_date' => $now->copy()->subDays(1)->setTime(15, 0),
                'priority' => 'normal',
                'final_copy' => "WELCOME TO HACK-RAJAGIRI 2026. 36 Hours of Non-stop Innovation.",
                'reference_links' => 'https://pinterest.com/pin/standee-tech-designs',
                'attachments' => null,
                'brand_constraints' => 'Sponsor logo banner lockup on bottom 15% clear space.',
                'type_specific_fields' => json_encode([
                    'dimensions' => '850 x 2000 mm (Rollup Standee)',
                    'format' => 'print',
                    'bleed_dpi' => '50mm bottom bleed, 150 DPI CMYK',
                    'orientation' => 'Vertical Standee',
                    'variants_count' => 1,
                ]),
                'status' => 'Approved',
                'ball_is_with' => 'Design Lead',
                'assigned_to' => 6, // Student Nova
                'collaborators' => null,
                'estimated_hours' => 6.0,
                'actual_hours_logged' => 5.5,
                'revision_count' => 1,
                'approved_by' => 3, // Requester approved
                'approved_at' => $now->copy()->subDays(1),
                'created_at' => $now->copy()->subDays(7),
                'updated_at' => $now->copy()->subDays(1),
            ],
            [
                'ticket_number' => 'DSN-2026-0147',
                'work_type' => 'poster',
                'title' => 'Annual Convocation 2026 Ceremonial Program Cover',
                'purpose' => 'Official printed ceremony guide given to dignitaries and parents.',
                'requester_id' => 1, // Director Office
                'requesting_division' => 'teaching',
                'target_audience' => 'Graduating students, families and distinguished faculty',
                'publishing_channel' => 'Offset Print Booklet',
                'required_by' => $now->copy()->subDays(10),
                'committed_delivery_date' => $now->copy()->subDays(10),
                'priority' => 'high',
                'final_copy' => "Twenty-Seventh Annual Convocation Ceremonies. Rajagiri School of Engineering & Technology.",
                'reference_links' => null,
                'attachments' => null,
                'brand_constraints' => 'Gold foil stamp embossed vector crest on front page.',
                'type_specific_fields' => json_encode([
                    'dimensions' => 'A4 Folded Booklet',
                    'format' => 'print',
                    'bleed_dpi' => '300 DPI CMYK Spot Gold',
                    'orientation' => 'Portrait',
                    'variants_count' => 1,
                ]),
                'status' => 'Closed',
                'ball_is_with' => '-',
                'assigned_to' => 6, // Student Nova
                'collaborators' => null,
                'estimated_hours' => 8.0,
                'actual_hours_logged' => 8.0,
                'revision_count' => 1,
                'approved_by' => 1,
                'approved_at' => $now->copy()->subDays(11),
                'created_at' => $now->copy()->subDays(14),
                'updated_at' => $now->copy()->subDays(10),
            ],
            [
                'ticket_number' => 'DSN-2026-0148',
                'work_type' => 'social_creative',
                'title' => 'Faculty Research Publication Spotlight Infographic',
                'purpose' => 'Showcasing Dr. Alice Smith’s paper on Neural Graph Networks published in IEEE.',
                'requester_id' => 9, // Dr. Alice Smith
                'requesting_division' => 'teaching',
                'target_audience' => 'Academia and Industry Partners',
                'publishing_channel' => 'LinkedIn & Twitter',
                'required_by' => $now->copy()->addDays(8),
                'committed_delivery_date' => null, // Not yet committed!
                'priority' => 'normal',
                'final_copy' => "Congratulations to Dr. Alice Smith and our AI-Ops research group for publishing in IEEE Transactions on Knowledge Engineering.",
                'reference_links' => 'https://twitter.com/example/research-highlights',
                'attachments' => null,
                'brand_constraints' => 'Clean academic typography with modern graph visualization diagram.',
                'type_specific_fields' => json_encode([
                    'platforms' => ['LinkedIn', 'Twitter/X'],
                    'creative_type' => 'single',
                    'slides_count' => 1,
                    'caption_text' => 'Proud to announce our faculty breakthrough in Graph Neural Architectures. Read the full paper: link in bio.',
                ]),
                'status' => 'New',
                'ball_is_with' => 'Design Lead',
                'assigned_to' => null, // Unassigned!
                'collaborators' => null,
                'estimated_hours' => 4.0,
                'actual_hours_logged' => 0,
                'revision_count' => 0,
                'created_at' => $now->copy()->subHours(6),
                'updated_at' => $now->copy()->subHours(6),
            ],
            [
                'ticket_number' => 'DSN-2026-0149',
                'work_type' => 'other',
                'title' => 'Lab Equipment Safety Warning Stickers & Iconography Kit',
                'purpose' => 'Vector iconography for laser cutter, 3D printers and high-voltage workstations.',
                'requester_id' => 5, // Faculty Member
                'requesting_division' => 'training',
                'target_audience' => 'Makerspace Students and Lab Attendants',
                'publishing_channel' => 'Vinyl Die-Cut Decals',
                'required_by' => $now->copy()->addDays(12),
                'committed_delivery_date' => null,
                'priority' => 'normal',
                'final_copy' => "CAUTION: EYE PROTECTION REQUIRED BEYOND THIS POINT.\nEMERGENCY SHUTOFF PROCEDURE...",
                'reference_links' => 'https://iso7010-standards.com/safety-signs',
                'attachments' => null,
                'brand_constraints' => 'ISO 7010 safety color compliance: Safety Yellow #FACC15, Warning Amber.',
                'type_specific_fields' => json_encode([
                    'scope_notes' => 'Custom die-cut safety sticker sheet for 10 mechanical stations.',
                ]),
                'status' => 'On Hold',
                'ball_is_with' => 'Design Lead',
                'assigned_to' => 8, // Student Spark
                'collaborators' => null,
                'estimated_hours' => 5.0,
                'actual_hours_logged' => 1.0,
                'on_hold_reason' => 'Waiting for Department Lab Safety Officer approval on official warning wording.',
                'revision_count' => 0,
                'created_at' => $now->copy()->subDays(3),
                'updated_at' => $now->copy()->subDay(),
            ],
        ];

        foreach ($tickets as $tData) {
            $ticketId = DB::table('design_tickets')->insertGetId($tData);

            // Seed Versions for tickets with progress
            if ($tData['ticket_number'] === 'DSN-2026-0142') {
                $v1 = DB::table('design_versions')->insertGetId([
                    'ticket_id' => $ticketId,
                    'version_number' => 1,
                    'uploader_id' => 6,
                    'file_url' => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
                    'file_name' => 'AI_Summit_Keynote_Poster_v1.png',
                    'file_type' => 'image',
                    'file_size_kb' => 4200,
                    'change_notes' => 'Initial high-fidelity layout draft with Rajagiri Emerald palette and typography hierarchy.',
                    'is_current' => false,
                    'is_approved' => false,
                    'created_at' => $now->copy()->subDays(2),
                    'updated_at' => $now->copy()->subDays(2),
                ]);

                $v2 = DB::table('design_versions')->insertGetId([
                    'ticket_id' => $ticketId,
                    'version_number' => 2,
                    'uploader_id' => 6,
                    'file_url' => 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200',
                    'file_name' => 'AI_Summit_Keynote_Poster_v2.png',
                    'file_type' => 'image',
                    'file_size_kb' => 4550,
                    'change_notes' => 'Updated QR code size for easier mobile scanning; strengthened contrast on keynote speaker titles.',
                    'is_current' => true,
                    'is_approved' => false,
                    'created_at' => $now->copy()->subHours(5),
                    'updated_at' => $now->copy()->subHours(5),
                ]);

                DB::table('design_tickets')->where('id', $ticketId)->update(['current_version_id' => $v2]);

                // Threaded comments on V1 and V2
                $c1 = DB::table('design_comments')->insertGetId([
                    'ticket_id' => $ticketId,
                    'version_id' => $v1,
                    'user_id' => 3, // Requester
                    'comment' => 'The background visual is striking! However, the QR code on the lower corner is slightly small for print distance. Can we bump it by 20%?',
                    'status' => 'resolved',
                    'resolved_by' => 6,
                    'resolved_at' => $now->copy()->subHours(6),
                    'created_at' => $now->copy()->subDay(),
                    'updated_at' => $now->copy()->subHours(6),
                ]);

                DB::table('design_comments')->insert([
                    'ticket_id' => $ticketId,
                    'version_id' => $v1,
                    'user_id' => 6, // Designer
                    'parent_id' => $c1,
                    'comment' => 'Applied in V2! Resized QR to 45mm x 45mm and re-positioned speaker titles.',
                    'status' => 'resolved',
                    'created_at' => $now->copy()->subHours(5),
                    'updated_at' => $now->copy()->subHours(5),
                ]);

                DB::table('design_comments')->insert([
                    'ticket_id' => $ticketId,
                    'version_id' => $v2,
                    'user_id' => 17, // Design Lead
                    'comment' => 'V2 looks balanced and ready for final review from the requester.',
                    'status' => 'open',
                    'created_at' => $now->copy()->subHours(2),
                    'updated_at' => $now->copy()->subHours(2),
                ]);

                // Audit log
                DB::table('design_audit_logs')->insert([
                    ['ticket_id' => $ticketId, 'user_id' => 3, 'action' => 'created', 'previous_value' => null, 'new_value' => 'New', 'reason' => 'Request submitted via intake brief', 'created_at' => $now->copy()->subDays(3)],
                    ['ticket_id' => $ticketId, 'user_id' => 17, 'action' => 'assigned', 'previous_value' => 'Unassigned', 'new_value' => 'Student Nova', 'reason' => 'Workload-aware allocation based on poster skillset', 'created_at' => $now->copy()->subDays(2)->addHours(2)],
                    ['ticket_id' => $ticketId, 'user_id' => 6, 'action' => 'version_upload', 'previous_value' => null, 'new_value' => 'V1', 'reason' => 'Initial draft uploaded', 'created_at' => $now->copy()->subDays(2)],
                    ['ticket_id' => $ticketId, 'user_id' => 6, 'action' => 'version_upload', 'previous_value' => 'V1', 'new_value' => 'V2', 'reason' => 'Addressed QR resize comments', 'created_at' => $now->copy()->subHours(5)],
                ]);
            }

            // Ticket 143: Social Carousel in review
            if ($tData['ticket_number'] === 'DSN-2026-0143') {
                $v1 = DB::table('design_versions')->insertGetId([
                    'ticket_id' => $ticketId,
                    'version_number' => 1,
                    'uploader_id' => 7,
                    'file_url' => 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1080',
                    'file_name' => 'Incubator_Carousel_Slides_1-6.png',
                    'file_type' => 'image',
                    'file_size_kb' => 6100,
                    'change_notes' => 'Complete 6-slide carousel formatted for 1080x1350 4:5 Instagram & LinkedIn post.',
                    'is_current' => true,
                    'is_approved' => false,
                    'created_at' => $now->copy()->subHours(4),
                    'updated_at' => $now->copy()->subHours(4),
                ]);

                DB::table('design_tickets')->where('id', $ticketId)->update(['current_version_id' => $v1]);

                DB::table('design_comments')->insert([
                    'ticket_id' => $ticketId,
                    'version_id' => $v1,
                    'user_id' => 5,
                    'comment' => 'Checking through slides 3 and 4 with the student founders now.',
                    'status' => 'open',
                    'created_at' => $now->copy()->subHours(2),
                    'updated_at' => $now->copy()->subHours(2),
                ]);
            }

            // Ticket 146 & 147: Approved & Closed -> Auto-archived to Asset Library
            if ($tData['ticket_number'] === 'DSN-2026-0146') {
                $v1 = DB::table('design_versions')->insertGetId([
                    'ticket_id' => $ticketId,
                    'version_number' => 1,
                    'uploader_id' => 6,
                    'file_url' => 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200',
                    'file_name' => 'HackRajagiri_Standee_Print_Ready.pdf',
                    'file_type' => 'pdf',
                    'file_size_kb' => 14200,
                    'change_notes' => 'Final print CMYK package with crop marks and vector sponsor grid.',
                    'is_current' => true,
                    'is_approved' => true,
                    'created_at' => $now->copy()->subDays(2),
                    'updated_at' => $now->copy()->subDays(1),
                ]);

                DB::table('design_tickets')->where('id', $ticketId)->update(['current_version_id' => $v1]);

                // Auto-archive in design_assets (PDF Module 8 requirement)
                DB::table('design_assets')->insert([
                    'title' => 'National Hackathon 2026 Campus Rollup Banners',
                    'campaign' => 'HackRajagiri 2026',
                    'division' => 'training',
                    'work_type' => 'poster',
                    'source_ticket_id' => $ticketId,
                    'designer_id' => 6,
                    'preview_url' => 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
                    'deliverable_url' => 'https://files.rajagiri.edu/design/deliverables/HackRajagiri_Standee_Print.pdf',
                    'source_file_url' => 'https://files.rajagiri.edu/design/source/HackRajagiri_Standee_Vector.ai',
                    'packaged_formats' => json_encode(['print_pdf' => 'HackRajagiri_Standee_Print.pdf', 'source_ai' => 'HackRajagiri_Standee_Vector.ai', 'preview_png' => 'preview.png']),
                    'tags' => json_encode(['Hackathon', 'Rollup Standee', 'Sponsors', 'CMYK', '2026']),
                    'usage_count' => 3, // Shows reuse count!
                    'metadata' => json_encode(['resolution' => '150 DPI', 'dimensions' => '850x2000mm', 'bleed' => '50mm']),
                    'created_at' => $now->copy()->subDays(1),
                    'updated_at' => $now->copy()->subDays(1),
                ]);
            }

            if ($tData['ticket_number'] === 'DSN-2026-0147') {
                $v1 = DB::table('design_versions')->insertGetId([
                    'ticket_id' => $ticketId,
                    'version_number' => 1,
                    'uploader_id' => 6,
                    'file_url' => 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200',
                    'file_name' => 'Convocation_2026_Ceremonial_Cover.pdf',
                    'file_type' => 'pdf',
                    'file_size_kb' => 9800,
                    'change_notes' => 'Gold foil spot emboss layer + CMYK deep emerald velvet finish.',
                    'is_current' => true,
                    'is_approved' => true,
                    'created_at' => $now->copy()->subDays(12),
                    'updated_at' => $now->copy()->subDays(11),
                ]);

                DB::table('design_tickets')->where('id', $ticketId)->update(['current_version_id' => $v1]);

                DB::table('design_assets')->insert([
                    'title' => 'Annual Convocation Ceremonial Program Cover Kit',
                    'campaign' => 'Convocation 2026',
                    'division' => 'teaching',
                    'work_type' => 'poster',
                    'source_ticket_id' => $ticketId,
                    'designer_id' => 6,
                    'preview_url' => 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
                    'deliverable_url' => 'https://files.rajagiri.edu/design/deliverables/Convocation_Cover_Print.pdf',
                    'source_file_url' => 'https://files.rajagiri.edu/design/source/Convocation_Cover_Vector.ai',
                    'packaged_formats' => json_encode(['print_pdf' => 'Convocation_Cover_Print.pdf', 'source_ai' => 'Convocation_Cover_Vector.ai']),
                    'tags' => json_encode(['Convocation', 'Ceremony', 'Gold Foil', 'Cover', 'Formal']),
                    'usage_count' => 7, // Highly reused!
                    'metadata' => json_encode(['finish' => 'Embossed Gold Foil', 'dimensions' => 'A4 Booklet', 'paper' => '300 GSM Matte']),
                    'created_at' => $now->copy()->subDays(10),
                    'updated_at' => $now->copy()->subDays(10),
                ]);
            }
        }

        // Additional standalone assets in library
        DB::table('design_assets')->insert([
            [
                'title' => 'Official RLabZ & Rajagiri Vector Crest Lockup Kit',
                'campaign' => 'Core Branding Guidelines',
                'division' => 'design',
                'work_type' => 'other',
                'source_ticket_id' => null,
                'designer_id' => 17, // Design Head
                'preview_url' => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
                'deliverable_url' => 'https://files.rajagiri.edu/design/brand/RLabZ_Official_Vector_Pack.zip',
                'source_file_url' => 'https://files.rajagiri.edu/design/brand/RLabZ_Brand_Master.fig',
                'packaged_formats' => json_encode(['svg_pack' => 'RLabZ_SVGs.zip', 'png_highres' => 'RLabZ_PNG_300dpi.zip', 'figma' => 'RLabZ_Brand_Master.fig']),
                'tags' => json_encode(['Brand Kit', 'Logos', 'Crest', 'Official', 'Master Vectors']),
                'usage_count' => 42,
                'metadata' => json_encode(['approved_by' => 'Director Office', 'version' => '2026.1']),
                'created_at' => $now->copy()->subMonths(2),
                'updated_at' => $now->copy()->subMonths(1),
            ],
            [
                'title' => 'Social Media Event Countdown Template (1080x1920 Story)',
                'campaign' => 'Campus Events 2026',
                'division' => 'training',
                'work_type' => 'social_creative',
                'source_ticket_id' => null,
                'designer_id' => 7,
                'preview_url' => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
                'deliverable_url' => 'https://files.rajagiri.edu/design/deliverables/Event_Countdown_Story.png',
                'source_file_url' => 'https://files.rajagiri.edu/design/source/Event_Countdown_Story.psd',
                'packaged_formats' => json_encode(['instagram_story_png' => 'story.png', 'photoshop_psd' => 'story.psd']),
                'tags' => json_encode(['Social Story', 'Instagram', 'Countdown', 'Template']),
                'usage_count' => 12,
                'metadata' => json_encode(['dimensions' => '1080x1920', 'aspect_ratio' => '9:16']),
                'created_at' => $now->copy()->subWeeks(3),
                'updated_at' => $now->copy()->subWeeks(1),
            ],
        ]);

        // Seed notifications
        DB::table('design_notifications')->insert([
            [
                'ticket_id' => 1,
                'user_id' => 6,
                'event' => 'New ticket assigned to you',
                'title' => 'Assigned: DSN-2026-0142',
                'message' => 'Design Head assigned you to International AI-Ops Symposium 2026 Keynote Poster.',
                'channel' => 'email + in-app',
                'is_read' => false,
                'created_at' => $now->copy()->subDays(2),
                'updated_at' => $now->copy()->subDays(2),
            ],
            [
                'ticket_id' => 2,
                'user_id' => 5,
                'event' => 'Version submitted, approval pending',
                'title' => 'Review Ready: DSN-2026-0143 V1',
                'message' => 'Student Orbit uploaded V1 for Student Innovation Incubator Showcase Carousel.',
                'channel' => 'email + in-app',
                'is_read' => false,
                'created_at' => $now->copy()->subHours(4),
                'updated_at' => $now->copy()->subHours(4),
            ],
            [
                'ticket_id' => 4,
                'user_id' => 8,
                'event' => 'Revision requested',
                'title' => 'Changes Requested: DSN-2026-0145',
                'message' => 'Director Office requested slide deck formatting changes on Milestone charts.',
                'channel' => 'email + in-app',
                'is_read' => true,
                'created_at' => $now->copy()->subHours(3),
                'updated_at' => $now->copy()->subHours(2),
            ],
        ]);
    }
}
