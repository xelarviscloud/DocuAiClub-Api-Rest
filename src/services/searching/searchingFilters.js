// Function to construct search filter based on the provided search string
const SearchFilter = (search) => {
    return search ? {
        $or: [
            { name: { $regex: new RegExp(search, 'i') } },
            { phone_number: { $regex: new RegExp(search, 'i') } },
            { email: { $regex: new RegExp(search, 'i') } },
            { address_line1: { $regex: new RegExp(search, 'i') } },
            { address_line2: { $regex: new RegExp(search, 'i') } },
            { state: { $regex: new RegExp(search, 'i') } },
            { city: { $regex: new RegExp(search, 'i') } },
            { zip_code: { $regex: new RegExp(search, 'i') } },
            { notes: { $regex: new RegExp(search, 'i') } },
        ]
    } : {};
};

export {SearchFilter}