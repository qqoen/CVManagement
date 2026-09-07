$.ajaxSetup({
    contentType: 'application/json',
});

class TableSelector {
    constructor(checkboxQuery, selectAllQuery) {
        this.selectedIds = new Set();
        const $checkboxes = $(checkboxQuery);

        $(selectAllQuery).change((e) => {
            $checkboxes.each((idx, cb) => {
                cb.checked = e.target.checked;
                this.toggle(cb.value, e.target.checked);
            });
        });

        $checkboxes.change((e) => {
            this.toggle(e.target.value, e.target.checked);
        });
    }

    toggle(id, value) {
        if (value) {
            this.selectedIds.add(id);
        } else {
            this.selectedIds.delete(id);
        }
    }
}

function initMarkdown(selector, canEdit=true) {
    $(selector).bsMarkdownEditor({
        minHeight: 240,
        preview: canEdit,
        mode: canEdit ? 'editor' : 'preview',
        resize: 'vertical',
        size: 'sm',
        btnClass: 'border-0',
        wrapperClass: null,
        actions: canEdit ? 'all' : [],
        lang: 'en',
    });
}
