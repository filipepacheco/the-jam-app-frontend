# Karaoke Jam Domain

This context describes the shared language for organizing a karaoke Jam, its Performances, and participating Musicians.

## Language

**Jam**:
An event hosted for a group of Musicians to perform Music together.
_Avoid_: Session, event

**Performance**:
A Music selection within a Jam, including its position, lifecycle status, and Performance Registrations. The backend currently exposes this concept through `Schedule*` transport names.
_Avoid_: Schedule entry, song, slot

**Schedule**:
The ordered collection of Performances belonging to a Jam.
_Avoid_: Performance, queue

**Live Queue**:
The playable projection of a Jam's Schedule, separated into previous, current, upcoming, and suggested Performances.
_Avoid_: Schedule, playlist

**Music**:
A reusable catalogue entry describing a piece of music that may appear in many Performances.
_Avoid_: Performance, song entry

**Performance Registration**:
A Musician's intent to participate in a Performance with a particular Instrument.
_Avoid_: Enrollment, Jam registration

**Musician**:
A performer profile that participates in a Jam. Every Musician currently belongs to a User; supporting guest Musicians without User accounts is future product and backend debt.
_Avoid_: User, participant

**User**:
An authenticated account that may own a Musician profile.
_Avoid_: Musician

**Instrument**:
The performing role selected by a Musician for a Performance Registration.
_Avoid_: Musician type, slot

**Suggestion**:
A proposed Performance that is not part of the playable Schedule until a host approves it.
_Avoid_: Scheduled Performance
