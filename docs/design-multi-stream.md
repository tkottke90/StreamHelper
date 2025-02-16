# Design: Multi-Streaming

We use the term "Multi-Streaming" to refer to using multiple captures (typically of the same content) and consolidating that into a single production.  In effect attempting to emulate typical sport-style broadcasts in which multiple camera perspectives are available.  To achieve this, the application is configured to accept streams from streaming platforms (like OBS Studio) and make them available for others to consume.

![Multi-Stream Concept](/docs/images/multi-stream-diagram.png)

In the above diagram, Thomas is hosting the primary stream and handles the majority of the production work (such as transitions and graphic effects).  Mark and Jerry are registered with the application and configured their OBS Studio instances to publish their streams of the same event to the **Stream Helper API**.  Thomas is then able to use a _Browser Source_ in OBS in order to consume those streams as video input, further enhancing the overall stream by adding additional perspectives.

This allows the team together to achieve effects such as:

- Instant Replay
- Perspectives from elsewhere in the event
- Separate Broadcast Analysis


---
<< [Home](/README.md) >>