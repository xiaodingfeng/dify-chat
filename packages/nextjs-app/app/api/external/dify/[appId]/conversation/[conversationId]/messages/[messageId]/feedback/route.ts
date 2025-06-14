import { genDifyRequest } from "@/app/api/utils";
import { NextRequest, NextResponse } from "next/server";

const POST = async (
	_request: NextRequest,
	{
		params,
	}: { params: { appId: string; conversationId: string; messageId: string } },
) => {
	const { appId, messageId } = await params;
	const { rating, content } = await _request.json();
	const user = _request.headers.get("dc-user") as string;
	if (!user) {
		return NextResponse.json({
			code: 401,
			message:
				'Unauthorized: lack of user. Please provide the "dc-user" header in your request.',
		});
	}
	const difyRequest = await genDifyRequest(appId);
	const result = await difyRequest.post(`/messages/${messageId}/feedbacks`, {
		user,
		rating,
		content,
	});
	return NextResponse.json({
		code: 200,
		data: result,
	});
};

export { POST };
