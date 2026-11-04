# Save architecture and recovery

Database: blockworld2-development, IndexedDB schema 1. No legacy localStorage key is read or written. World records have independent IDs, template identity, metadata/revision, separate world/player/preferences payloads, an integrity checksum and three previous checkpoints. Transactions compare revisions before writing, so stale tabs cannot overwrite newer progress.

An edit triggers a save; periodic and visibility/blur saves also capture movement. World switching awaits a committed save. A failed write blocks destructive switching and shows a persistent export/save-new-copy alert while active state remains in memory. No failure path deletes or replaces the original record with a fresh world. Browser termination can still lose edits not yet committed; portable backups remain necessary.

Corrupt current checkpoints fall back to a valid previous checkpoint without changing the damaged record. Recovered state must be saved as a new instance. Checksum is a corruption check, not authentication. Names are inserted through textContent. Imports are capped, versioned and validated; malformed imports leave the active instance unchanged.

The world screen creates/selects/resumes/renames/duplicates instances. Export uses a downloadable .bw2 JSON container; import uses a real file input. A plain schema-1-to-4 legacy JSON is validated using the frozen upstream validator, imported as a new Legacy 06 instance, and its original bytes are retained. World geometry is built and clearance-checked before replacing the active scene. Original exports are not silently imported onto the new town.

Current limitations: browser best-effort storage may be evicted; physical iPhone share-sheet/text fallbacks, user-driven raw recovery export, checkpoint selection UI, persistent-storage request, full-disk/quota device testing and long-term migrations are follow-up work. Tests inject corrupt records, stale writers and a closed database; they do not simulate an actually full tablet disk.
