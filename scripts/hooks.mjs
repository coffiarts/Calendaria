/**
 * Calendaria Hook Registration
 * All hooks for the Calendaria module should be registered here.
 * @module Hooks
 * @author Tyler
 */

import { MODULE, SYSTEM } from './constants.mjs';
import { log } from './utils/logger.mjs';
import { onRenderSceneConfig, onUpdateWorldTime } from './darkness.mjs';
import CalendarManager from './calendar/calendar-manager.mjs';
import NoteManager from './notes/note-manager.mjs';
import TimeTracker from './time/time-tracker.mjs';
import EventScheduler from './time/event-scheduler.mjs';
import { CalendarApplication } from './applications/calendar-application.mjs';
import { registerRestTimeHooks } from './integrations/rest-time.mjs';

/**
 * Register all hooks for the Calendaria module.
 * @returns {void}
 */
export function registerHooks() {
  // Darkness hooks
  Hooks.on('renderSceneConfig', onRenderSceneConfig);
  Hooks.on('updateWorldTime', onUpdateWorldTime);

  // Time tracking hooks
  Hooks.on('updateWorldTime', TimeTracker.onUpdateWorldTime.bind(TimeTracker));

  // Event scheduler hooks (triggers notifications when time reaches note start dates)
  Hooks.on('updateWorldTime', EventScheduler.onUpdateWorldTime.bind(EventScheduler));

  // Calendar Manager hooks
  if (SYSTEM.isDnd5e) Hooks.on('updateSetting', CalendarManager.onUpdateSetting.bind(CalendarManager));
  if (!SYSTEM.isDnd5e) Hooks.on('closeGame', CalendarManager.onCloseGame.bind(CalendarManager));

  // Note Manager hooks
  Hooks.on('createJournalEntryPage', NoteManager.onCreateJournalEntryPage.bind(NoteManager));
  Hooks.on('updateJournalEntryPage', NoteManager.onUpdateJournalEntryPage.bind(NoteManager));
  Hooks.on('deleteJournalEntryPage', NoteManager.onDeleteJournalEntryPage.bind(NoteManager));
  Hooks.on('calendaria.calendarSwitched', NoteManager.onCalendarSwitched.bind(NoteManager));
  Hooks.on('preDeleteJournalEntry', NoteManager.onPreDeleteJournalEntry.bind(NoteManager));
  Hooks.on('preDeleteFolder', NoteManager.onPreDeleteFolder.bind(NoteManager));

  // Journal sidebar button
  Hooks.on('renderJournalDirectory', addJournalCalendarButton);

  // Chat message hooks (for announcement click handlers)
  Hooks.on('renderChatMessageHTML', onRenderChatMessage);

  // System integrations
  registerRestTimeHooks();

  log(3, 'Hooks registered');
}

/* -------------------------------------------- */

/**
 * Add Calendar button to journal sidebar footer.
 * @param {Application} app - The journal sidebar application
 * @todo move this to correct utility file.
 * @returns {void}
 */
function addJournalCalendarButton(app) {
  if (SYSTEM.isDnd5e) return;
  const footer = app.element.querySelector('.directory-footer');
  if (!footer) return;

  // Check if already added
  if (footer.querySelector('.calendaria-open-button')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'calendaria-open-button';
  button.innerHTML = `<i class="fas fa-calendar-days"></i> ${game.i18n.localize('CALENDARIA.HUD.OpenCalendar')}`;
  button.addEventListener('click', () => new CalendarApplication().render(true));

  footer.appendChild(button);
  log(3, 'Journal calendar button added');
}

/* -------------------------------------------- */

/**
 * Handle renderChatMessage hook for calendar announcements.
 * @param {ChatMessage} message - The chat message document
 * @param {HTMLElement} html - The rendered HTML element
 * @param {object} context - Render context
 * @todo move this to correct utility file.
 */
function onRenderChatMessage(message, html, context) {
  // Only process calendaria announcements
  if (!message.flags?.[MODULE.ID]?.isAnnouncement) return;

  // Add click handler for "Open Note" link
  const openLink = html.querySelector('.announcement-open');
  if (openLink) {
    openLink.addEventListener('click', async (event) => {
      event.preventDefault();
      const noteId = openLink.dataset.noteId;
      const journalId = openLink.dataset.journalId;

      if (!noteId) return;

      // Find and render the note sheet in view mode
      const page = NoteManager.getFullNote(noteId);
      if (page) {
        page.sheet.render(true, { mode: 'view' });
      } else if (journalId) {
        // Fallback: try to open the journal
        const journal = game.journal.get(journalId);
        if (journal) journal.sheet.render(true, { pageId: noteId });
      }
    });
  }
}
