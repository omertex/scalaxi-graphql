const data = [
    { id: 100001, userName: "dkhanevich", firstName: "Dmitry", lastName: "Khanevich", roles:["manager"], password: "123" },
    { id: 100002, userName: "avanushin", firstName: "Andrey", lastName: "Vanushin", roles:["developer"], password: "123", managerId:  100001 },
    { id: 100003, userName: "kdrobysh", firstName: "Kristina", lastName: "Drobysh", roles:["developer"], password: "123", managerId:  100001 },
];

module.exports = {
    data
}