<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AthleteInvite extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $clubName,
        public string $token,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You've been added to {$this->clubName} on PathwayHQ",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.athlete-invite',
        );
    }
}
