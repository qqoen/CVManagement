$(() => {
    const tableSelector = new TableSelector('.attribute-checkbox', '#select-all');

    $('#delete-btn').click(() => {
        $.post('/CVAttribute/Delete', JSON.stringify([...tableSelector.selectedIds])).then(() => {
            location.reload();
        });
    });

    $('#add-btn').click(() => {
        $.post('/CVAttribute/AddToUser', JSON.stringify([...tableSelector.selectedIds])).then(() => {
            location.reload();
        });
    });
});
