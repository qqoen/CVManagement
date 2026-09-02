$(() => {
    const tableSelector = new TableSelector('.project-checkbox', '#select-all');

    $('#delete-btn').click(() => {
        $.post('/Project/Delete', JSON.stringify([...tableSelector.selectedIds])).then(() => {
            location.reload();
        });
    });
});
