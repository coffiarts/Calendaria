/**
 * Calendar Note Sheet
 * Sheet for editing calendar note journal entry pages with ProseMirror editor.
 *
 * @module Sheets/CalendarNoteSheet
 * @author Tyler
 */

const { HandlebarsApplicationMixin } = foundry.applications.api;

import { log } from '../utils/logger.mjs';
import CalendarManager from '../calendar/calendar-manager.mjs';
import { getAllCategories, addCustomCategory, deleteCustomCategory, isCustomCategory } from '../notes/note-data.mjs';

export class CalendarNoteSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.journal.JournalEntryPageSheet) {
  static DEFAULT_OPTIONS = {
    classes: ['calendaria', 'calendar-note-sheet'],
    position: { width: 650, height: 850 },
    actions: {
      selectIcon: this._onSelectIcon,
      selectDate: this._onSelectDate,
      saveAndClose: this._onSaveAndClose,
      reset: this._onReset,
      deleteNote: this._onDeleteNote,
      addCategory: this._onAddCategory
    },
    form: {
      closeOnSubmit: false
    }
  };

  static PARTS = {
    form: { template: 'modules/calendaria/templates/sheets/calendar-note-form.hbs' }
  };

  /** @override */
  get title() {
    return this.document.name;
  }

  _attachPartListeners(partId, htmlElement, options) {
    super._attachPartListeners(partId, htmlElement, options);

    // Add contextmenu listener for icon picker
    const iconPicker = htmlElement.querySelector('.icon-picker');
    if (iconPicker) {
      iconPicker.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        this.constructor._switchIconMode(event, iconPicker);
      });
    }

    // Add contextmenu listener for category tags (to delete custom categories)
    // Use event delegation on the container since tags are rendered dynamically
    const categoriesContainer = htmlElement.querySelector('.categories-container');
    if (categoriesContainer) {
      categoriesContainer.addEventListener('contextmenu', (event) => {
        log(3, 'Categories contextmenu event', event.target, event.target.className);

        // Try multiple possible selectors for the tag element
        const tag = event.target.closest('.tag');
        if (!tag) {
          log(3, 'No tag found in event path');
          return;
        }

        // Foundry multi-select uses data-key for the tag value
        const categoryId = tag.dataset.key;
        log(3, 'Tag found', tag, 'categoryId:', categoryId);

        if (!categoryId || !isCustomCategory(categoryId)) {
          log(3, 'Not a custom category or no categoryId');
          return;
        }

        event.preventDefault();
        this.#showDeleteCategoryMenu(event, categoryId, tag.textContent.trim());
      });
    }
  }

  /**
   * Show context menu to delete a custom category.
   * @param {MouseEvent} event - The context menu event
   * @param {string} categoryId - The category ID
   * @param {string} categoryLabel - The category label for display
   */
  async #showDeleteCategoryMenu(event, categoryId, categoryLabel) {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: 'Delete Category' },
      content: `<p>Delete custom category "${categoryLabel}"?</p><p class="hint">This will remove it from the list but won't affect notes already using it.</p>`,
      rejectClose: false,
      modal: true
    });

    if (confirmed) {
      const deleted = await deleteCustomCategory(categoryId);
      if (deleted) {
        ui.notifications.info(`Category "${categoryLabel}" deleted`);
        this.render();
      }
    }
  }

  _onFirstRender(context, options) {
    super._onFirstRender(context, options);

    // Inject Save and Reset buttons into window header
    const windowHeader = this.element.querySelector('.window-header');
    if (!windowHeader) return;

    // Find or create a controls container at the beginning of the header
    let controlsContainer = windowHeader.querySelector('.header-controls');
    if (!controlsContainer) {
      controlsContainer = document.createElement('div');
      controlsContainer.className = 'header-controls';

      // Insert at the very beginning of window-header
      windowHeader.insertBefore(controlsContainer, windowHeader.firstChild);
    }

    // Create Save button
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'header-control icon fa-solid fa-save';
    saveBtn.dataset.action = 'saveAndClose';
    saveBtn.dataset.tooltip = 'Save & Close';
    saveBtn.setAttribute('aria-label', 'Save & Close');
    controlsContainer.appendChild(saveBtn);

    // Create Reset button
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'header-control icon fa-solid fa-undo';
    resetBtn.dataset.action = 'reset';
    resetBtn.dataset.tooltip = 'Reset Form';
    resetBtn.setAttribute('aria-label', 'Reset Form');
    controlsContainer.appendChild(resetBtn);

    // Create Delete button (only for owners of existing notes)
    if (this.document.isOwner && this.document.id) {
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'header-control icon fa-solid fa-trash';
      deleteBtn.dataset.action = 'deleteNote';
      deleteBtn.dataset.tooltip = 'Delete Note';
      deleteBtn.setAttribute('aria-label', 'Delete Note');
      controlsContainer.appendChild(deleteBtn);
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.document.system;
    context.text = this.document.text;

    // Get active calendar
    const calendar = CalendarManager.getActiveCalendar();

    // Get current game time as fallback
    const components = game.time.components || { year: 1492, month: 0, dayOfMonth: 0 };
    const yearZero = calendar?.years?.yearZero ?? 0;
    const currentYear = components.year + yearZero;
    const currentMonth = components.month ?? 0;
    const currentDay = (components.dayOfMonth ?? 0) + 1; // Convert 0-indexed to 1-indexed

    // Auto-detect Font Awesome icons
    if (context.system.icon && context.system.icon.startsWith('fa')) context.iconType = 'fontawesome';
    else context.iconType = context.system.iconType || 'image';

    // Format start date display using calendar (defaults to current calendar date)
    const startYear = this.document.system.startDate.year || currentYear;
    const startMonth = this.document.system.startDate.month ?? currentMonth;
    const startDay = this.document.system.startDate.day || currentDay;
    context.startDateDisplay = this._formatDateDisplay(calendar, startYear, startMonth, startDay);

    // Format end date display (defaults to start date if not set)
    const endYear = this.document.system.endDate?.year || startYear;
    const endMonth = this.document.system.endDate?.month ?? startMonth;
    const endDay = this.document.system.endDate?.day || startDay;
    context.endDateDisplay = this._formatDateDisplay(calendar, endYear, endMonth, endDay);

    // Format time as HH:mm
    const hour = String(this.document.system.startDate.hour ?? 12).padStart(2, '0');
    const minute = String(this.document.system.startDate.minute ?? 0).padStart(2, '0');
    context.timeValue = `${hour}:${minute}`;

    // Prepare repeat options with selected state
    context.repeatOptions = [
      { value: 'never', label: 'Never', selected: this.document.system.repeat === 'never' },
      { value: 'daily', label: 'Daily', selected: this.document.system.repeat === 'daily' },
      { value: 'weekly', label: 'Weekly', selected: this.document.system.repeat === 'weekly' },
      { value: 'monthly', label: 'Monthly', selected: this.document.system.repeat === 'monthly' },
      { value: 'yearly', label: 'Yearly', selected: this.document.system.repeat === 'yearly' }
    ];

    // Prepare category options with selected state
    const selectedCategories = this.document.system.categories || [];
    context.categoryOptions = getAllCategories().map((cat) => ({
      ...cat,
      selected: selectedCategories.includes(cat.id)
    }));

    return context;
  }

  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);

    // Convert date input (yyyy-mm-dd) to individual components
    if (event.target?.name === 'system.startDate.date') {
      const [year, month, day] = event.target.value.split('-').map(Number);
      if (year && month && day) {
        // Create hidden inputs or update the form data directly
        const form = event.target.closest('form');
        const updateField = (name, value) => {
          let input = form.querySelector(`input[name="${name}"]`);
          if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            form.appendChild(input);
          }
          input.value = value;
        };

        updateField('system.startDate.year', year);
        updateField('system.startDate.month', month - 1); // Convert to 0-indexed
        updateField('system.startDate.day', day);
      }
    }

    // Convert end date input (yyyy-mm-dd) to individual components
    if (event.target?.name === 'system.endDate.date') {
      const form = event.target.closest('form');
      const updateField = (name, value) => {
        let input = form.querySelector(`input[name="${name}"]`);
        if (!input) {
          input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          form.appendChild(input);
        }
        input.value = value;
      };

      if (event.target.value) {
        const [year, month, day] = event.target.value.split('-').map(Number);
        if (year && month && day) {
          updateField('system.endDate.year', year);
          updateField('system.endDate.month', month - 1); // Convert to 0-indexed
          updateField('system.endDate.day', day);
        }
      } else {
        // Clear end date if input is cleared
        updateField('system.endDate.year', '');
        updateField('system.endDate.month', '');
        updateField('system.endDate.day', '');
      }
    }

    // Convert time input (HH:mm) to individual components
    if (event.target?.name === 'system.startDate.time') {
      const [hour, minute] = event.target.value.split(':').map(Number);
      if (!isNaN(hour) && !isNaN(minute)) {
        const form = event.target.closest('form');
        const updateField = (name, value) => {
          let input = form.querySelector(`input[name="${name}"]`);
          if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            form.appendChild(input);
          }
          input.value = value;
        };

        updateField('system.startDate.hour', hour);
        updateField('system.startDate.minute', minute);
      }
    }

    // Handle All Day checkbox to disable/enable time input
    if (event.target?.name === 'system.allDay') {
      const form = event.target.closest('form');
      const timeInput = form.querySelector('input[name="system.startDate.time"]');
      if (timeInput) {
        timeInput.disabled = event.target.checked;
      }
    }

    // Handle color changes to update icon preview
    if (event.target?.name === 'system.color') {
      const form = event.target.closest('form');
      const color = event.target.value;

      // Update Font Awesome icon color
      const iconPreview = form.querySelector('.icon-picker i.icon-preview');
      if (iconPreview) {
        iconPreview.style.color = color;
      }

      // Update image color using CSS filter (works best with SVGs)
      const imgPreview = form.querySelector('.icon-picker img.icon-preview');
      if (imgPreview) {
        // Use drop-shadow trick to colorize the image
        imgPreview.style.filter = `drop-shadow(0px 1000px 0 ${color})`;
        imgPreview.style.transform = 'translateY(-1000px)';
      }
    }
  }

  /**
   * Handle icon selection (left-click)
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - The capturing HTML element
   */
  static async _onSelectIcon(event, target) {
    event.preventDefault();

    // Open icon picker based on current type
    const iconType = target.dataset.iconType || 'image';

    if (iconType === 'fontawesome') {
      // Prompt for Font Awesome class
      const currentIcon = target.querySelector('i')?.className.replace('icon-preview', '').trim() || '';
      const newIcon = await foundry.applications.api.DialogV2.prompt({
        window: { title: 'Font Awesome Icon' },
        content: `<div class="form-group"><label>Font Awesome Classes</label><input type="text" name="icon-class" value="${currentIcon}" placeholder="fas fa-calendar" /></div>`,
        ok: {
          callback: (event, button) => {
            return button.form.elements['icon-class'].value;
          }
        },
        rejectClose: false
      });

      if (newIcon) {
        const iconElement = target.querySelector('i.icon-preview');
        if (iconElement) {
          iconElement.className = `${newIcon} icon-preview`;
        }
        const hiddenInput = target.querySelector('input[name="system.icon"]');
        if (hiddenInput) hiddenInput.value = newIcon;
      }
    } else {
      // Image picker
      const currentPath = target.querySelector('img')?.src;

      const picker = new foundry.applications.apps.FilePicker({
        type: 'image',
        current: currentPath,
        callback: (path) => {
          const img = target.querySelector('img');
          if (img) img.src = path;
          const hiddenInput = target.querySelector('input[name="system.icon"]');
          if (hiddenInput) hiddenInput.value = path;
        }
      });

      picker.render(true);
    }
  }

  /**
   * Handle right-click to switch icon mode
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - The icon picker element
   */
  static async _switchIconMode(event, target) {
    const iconType = target.dataset.iconType || 'image';
    const newType = iconType === 'image' ? 'fontawesome' : 'image';

    // Update data attribute
    target.dataset.iconType = newType;

    // Update hidden input
    const typeInput = target.querySelector('input[name="system.iconType"]');
    if (typeInput) typeInput.value = newType;

    // Get current color
    const form = target.closest('form');
    const colorInput = form?.querySelector('input[name="system.color"]');
    const color = colorInput?.value || '#4a9eff';

    // Replace icon display
    if (newType === 'fontawesome') {
      const img = target.querySelector('img');
      if (img) {
        const icon = document.createElement('i');
        icon.className = 'fas fa-calendar icon-preview';
        icon.style.color = color;
        img.replaceWith(icon);
      }
      const iconInput = target.querySelector('input[name="system.icon"]');
      if (iconInput) iconInput.value = 'fas fa-calendar';
    } else {
      const icon = target.querySelector('i');
      if (icon) {
        const img = document.createElement('img');
        img.src = 'icons/svg/book.svg';
        img.alt = 'Note Icon';
        img.className = 'icon-preview';
        // Apply color filter for SVG colorization
        img.style.filter = `drop-shadow(0px 1000px 0 ${color})`;
        img.style.transform = 'translateY(-1000px)';
        icon.replaceWith(img);
      }
      const iconInput = target.querySelector('input[name="system.icon"]');
      if (iconInput) iconInput.value = 'icons/svg/book.svg';
    }
  }

  /**
   * Format a date for display using the calendar system
   * @param {CalendariaCalendar} calendar - The calendar to use
   * @param {number} year - The year
   * @param {number} month - The month index (0-based)
   * @param {number} day - The day
   * @returns {string} - Formatted date string
   * @private
   */
  _formatDateDisplay(calendar, year, month, day) {
    if (!calendar || !calendar.months?.values) return `${day} / ${month + 1} / ${year}`;

    const monthData = calendar.months.values[month];
    const monthName = monthData?.name ? game.i18n.localize(monthData.name) : `Month ${month + 1}`;
    return `${day} ${monthName}, ${year}`;
  }

  /**
   * Handle date selection button click
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - The capturing HTML element
   */
  static async _onSelectDate(event, target) {
    const dateField = target.dataset.dateField; // 'startDate' or 'endDate'
    const form = target.closest('form');
    if (!form) return;

    // Get calendar
    const calendar = CalendarManager.getActiveCalendar();
    if (!calendar) {
      ui.notifications.error('No active calendar found');
      return;
    }

    // Get current game time as fallback
    const components = game.time.components;
    const yearZero = calendar?.years?.yearZero ?? 0;
    const fallbackYear = components.year + yearZero;
    const fallbackMonth = components.month ?? 0;
    const fallbackDay = (components.dayOfMonth ?? 0) + 1; // Convert 0-indexed to 1-indexed

    // Get current date values from form (or use calendar's current date as fallback)
    const yearInput = form.querySelector(`input[name="system.${dateField}.year"]`);
    const monthInput = form.querySelector(`input[name="system.${dateField}.month"]`);
    const dayInput = form.querySelector(`input[name="system.${dateField}.day"]`);

    const currentYear = parseInt(yearInput?.value) || fallbackYear;
    const parsedMonth = parseInt(monthInput?.value);
    const currentMonth = !isNaN(parsedMonth) ? parsedMonth : fallbackMonth;
    const currentDay = parseInt(dayInput?.value) || fallbackDay;

    // Show date picker dialog
    const result = await CalendarNoteSheet._showDatePickerDialog(calendar, currentYear, currentMonth, currentDay);
    if (!result) return;

    // Update form fields
    if (yearInput) yearInput.value = result.year;
    if (monthInput) monthInput.value = result.month;
    if (dayInput) dayInput.value = result.day;

    // Update display
    const displaySpan = target.querySelector('.date-display');
    if (displaySpan) {
      const monthData = calendar.months.values[result.month];
      const monthName = monthData?.name ? game.i18n.localize(monthData.name) : `Month ${result.month + 1}`;
      displaySpan.textContent = `${result.day} ${monthName}, ${result.year}`;
    }

    // Trigger change event for form
    const changeEvent = new Event('change', { bubbles: true });
    form.dispatchEvent(changeEvent);
  }

  /**
   * Show date picker dialog
   * @param {CalendariaCalendar} calendar - The calendar to use
   * @param {number} currentYear - Current year
   * @param {number} currentMonth - Current month (0-based)
   * @param {number} currentDay - Current day
   * @returns {Promise<{year: number, month: number, day: number}|null>}
   * @private
   */
  static async _showDatePickerDialog(calendar, currentYear, currentMonth, currentDay) {
    // Build month options
    const monthOptions = calendar.months.values.map((m, i) => `<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${game.i18n.localize(m.name)}</option>`).join('');

    // Build day options for current month
    const daysInMonth = calendar.months.values[currentMonth]?.days || 30;
    const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1)
      .map((d) => `<option value="${d}" ${d === currentDay ? 'selected' : ''}>${d}</option>`)
      .join('');

    const content = `
      <div class="form-group">
        <label>Year</label>
        <input type="number" name="year" value="${currentYear}" />
      </div>
      <div class="form-group">
        <label>Month</label>
        <select name="month" id="month-select">${monthOptions}</select>
      </div>
      <div class="form-group">
        <label>Day</label>
        <select name="day" id="day-select">${dayOptions}</select>
      </div>
    `;

    return foundry.applications.api.DialogV2.prompt({
      window: { title: 'Select Date' },
      content,
      ok: {
        callback: (event, button) => {
          return {
            year: parseInt(button.form.elements.year.value),
            month: parseInt(button.form.elements.month.value),
            day: parseInt(button.form.elements.day.value)
          };
        }
      },
      render: (event, dialog) => {
        const html = dialog.element;
        // Update day options when month changes
        const monthSelect = html.querySelector('#month-select');
        const daySelect = html.querySelector('#day-select');

        monthSelect.addEventListener('change', () => {
          const selectedMonth = parseInt(monthSelect.value);
          const daysInSelectedMonth = calendar.months.values[selectedMonth]?.days || 30;

          // Rebuild day options
          daySelect.innerHTML = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1)
            .map((d) => `<option value="${d}">${d}</option>`)
            .join('');
        });
      },
      rejectClose: false
    });
  }

  /**
   * Handle save and close button click
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - The capturing HTML element
   */
  static async _onSaveAndClose(event, target) {
    // Submit the form
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    this.element.dispatchEvent(submitEvent);

    // Close the sheet after a brief delay to allow save to complete
    setTimeout(() => {
      this.close();
    }, 100);
  }

  /**
   * Handle delete note button click
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - The capturing HTML element
   */
  static async _onDeleteNote(event, target) {
    if (!this.document.isOwner) return;

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: 'Delete Note' },
      content: `<p>Delete note "${this.document.name}"?</p>`,
      rejectClose: false,
      modal: true
    });

    if (confirmed) {
      const journal = this.document.parent;
      await this.close();

      // If journal only has this page, delete the entire journal
      if (journal.pages.size === 1) await journal.delete();
      else await this.document.delete();
    }
  }

  /**
   * Handle reset button click
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - The capturing HTML element
   */
  static async _onReset(event, target) {
    // Get current calendar date/time as defaults
    const calendar = CalendarManager.getActiveCalendar();
    const currentDateTime = CalendarManager.getCurrentDateTime();

    const currentYear = currentDateTime.year;
    const currentMonth = currentDateTime.month;
    const currentDay = currentDateTime.day;
    const currentHour = currentDateTime.hour;
    const currentMinute = currentDateTime.minute;

    const form = this.element;

    // Reset title
    const titleInput = form.querySelector('input[name="name"]');
    if (titleInput) titleInput.value = 'New Note';

    // Reset emblem
    const iconInput = form.querySelector('input[name="system.icon"]');
    const iconTypeInput = form.querySelector('input[name="system.iconType"]');
    const colorInput = form.querySelector('input[name="system.color"]');
    if (iconInput) iconInput.value = 'icons/svg/book.svg';
    if (iconTypeInput) iconTypeInput.value = 'image';
    if (colorInput) colorInput.value = '#4a9eff';

    // Update icon preview
    const iconPicker = form.querySelector('.icon-picker');
    if (iconPicker) {
      iconPicker.dataset.iconType = 'image';
      const existingIcon = iconPicker.querySelector('i, img');
      if (existingIcon) {
        const img = document.createElement('img');
        img.src = 'icons/svg/book.svg';
        img.alt = 'Note Icon';
        img.className = 'icon-preview';
        img.style.filter = 'drop-shadow(0px 1000px 0 #4a9eff)';
        img.style.transform = 'translateY(-1000px)';
        existingIcon.replaceWith(img);
      }
    }

    // Reset visibility
    const gmOnlyInput = form.querySelector('input[name="system.gmOnly"]');
    if (gmOnlyInput) gmOnlyInput.checked = false;

    // Reset dates to current calendar date
    const startYearInput = form.querySelector('input[name="system.startDate.year"]');
    const startMonthInput = form.querySelector('input[name="system.startDate.month"]');
    const startDayInput = form.querySelector('input[name="system.startDate.day"]');
    if (startYearInput) startYearInput.value = currentYear;
    if (startMonthInput) startMonthInput.value = currentMonth;
    if (startDayInput) startDayInput.value = currentDay;

    const endYearInput = form.querySelector('input[name="system.endDate.year"]');
    const endMonthInput = form.querySelector('input[name="system.endDate.month"]');
    const endDayInput = form.querySelector('input[name="system.endDate.day"]');
    if (endYearInput) endYearInput.value = currentYear;
    if (endMonthInput) endMonthInput.value = currentMonth;
    if (endDayInput) endDayInput.value = currentDay;

    // Update date display
    const dateDisplay = this._formatDateDisplay(calendar, currentYear, currentMonth, currentDay);
    const startDateDisplay = form.querySelector('[data-date-field="startDate"] .date-display');
    const endDateDisplay = form.querySelector('[data-date-field="endDate"] .date-display');
    if (startDateDisplay) startDateDisplay.textContent = dateDisplay;
    if (endDateDisplay) endDateDisplay.textContent = dateDisplay;

    // Reset time to current time
    const hourInput = form.querySelector('input[name="system.startDate.hour"]');
    const minuteInput = form.querySelector('input[name="system.startDate.minute"]');
    const timeInput = form.querySelector('input[name="system.startDate.time"]');
    if (hourInput) hourInput.value = currentHour;
    if (minuteInput) minuteInput.value = currentMinute;
    if (timeInput) timeInput.value = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // Reset all day checkbox
    const allDayInput = form.querySelector('input[name="system.allDay"]');
    if (allDayInput) {
      allDayInput.checked = false;
      if (timeInput) timeInput.disabled = false;
    }

    // Reset repeat to never
    const repeatSelect = form.querySelector('select[name="system.repeat"]');
    if (repeatSelect) repeatSelect.value = 'never';

    // Reset categories (multi-select)
    const multiSelect = form.querySelector('multi-select[name="system.categories"]');
    if (multiSelect) {
      multiSelect.querySelectorAll('option').forEach((opt) => (opt.selected = false));
      multiSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Reset custom category input
    const newCategoryInput = form.querySelector('.new-category-input');
    if (newCategoryInput) newCategoryInput.value = '';

    // Reset ProseMirror editor
    const proseMirror = form.querySelector('prose-mirror#note-content');
    if (proseMirror) {
      // Try to clear the content by setting value
      proseMirror.value = '';
      // Also try setting innerHTML as a fallback
      const editorContent = proseMirror.querySelector('.ProseMirror');
      if (editorContent) editorContent.innerHTML = '<p></p>';
    }
  }

  /**
   * Handle add custom category button click
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - The capturing HTML element
   */
  static async _onAddCategory(event, target) {
    const form = target.closest('form');
    const input = form?.querySelector('.new-category-input');
    const label = input?.value?.trim();

    if (!label) {
      ui.notifications.warn('Please enter a category name');
      return;
    }

    // Add the custom category
    const newCategory = await addCustomCategory(label);

    // Clear the input
    input.value = '';

    // Re-render the sheet to show the new category
    this.render();

    // Notify success
    ui.notifications.info(`Category "${newCategory.label}" added`);
  }
}
