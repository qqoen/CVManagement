$(() => {
    const tableSelector = new TableSelector('.position-checkbox', '#select-all');

    $('#delete-btn').click(() => {
        $.post('/Position/Delete', JSON.stringify([...tableSelector.selectedIds])).then(() => {
            location.reload();
        });
    });
});

// const table = new DataTable('#positions-table', {
//     data: [],
//     columns: [
//         {
//             className: 'dt-control',
//             orderable: false,
//             data: null,
//             defaultContent: ''
//         },
//         { data: 'position' },
//         { data: 'description' },
//         { data: 'lastUpdated' },
//     ],
//     ordering: false,
//     searching: false,
//     layout: {
//         topStart: null
//     },
// });
