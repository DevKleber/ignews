import { NextApiRequest, NextApiResponse } from "next";

export default (request: NextApiRequest, response: NextApiResponse) => {
	const id = request.query.id;
	console.log(id);

	const users = [
		{ id: 1, nome: "kleber" },
		{ id: 2, nome: "Anna" },
		{ id: 3, nome: "Simone" },
	];

	return response.json(users);
};
