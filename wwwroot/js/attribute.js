$(() => {
    const tableSelector = new TableSelector('.attribute-checkbox', '#select-all');

    $('#delete-btn').click(() => {
        console.log('delete btn pressed');
        $.post('/CVAttribute/Delete', JSON.stringify([...tableSelector.selectedIds])).then(() => {
            location.reload();
        });
    });

    $('#add-btn').click(() => {
        console.log('add btn pressed');
        $.post('/CVAttribute/AddToUser', JSON.stringify([...tableSelector.selectedIds])).then(() => {
            location.reload();
        });
    });
});
