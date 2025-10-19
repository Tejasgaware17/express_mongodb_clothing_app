import { mongoose } from "mongoose";

export async function generateTitle(doc) {
	const style = doc.style || {};
	const titleParts = [style.fit, style.pattern];

	let categoryName = "";
	if (doc.category) {
		if (doc.category.name) {
			categoryName = doc.category.name;
		} else {
			const categoryDoc = await mongoose
				.model("Category")
				.findById(doc.category);
			if (categoryDoc) {
				categoryName = categoryDoc.name;
			}
		}
	}

	const generatedTitle = titleParts
		.filter((part) => part)
		.join(" ")
		.toUpperCase();

	const finalTitle = `${generatedTitle} ${categoryName.toUpperCase()}`.trim();
	return finalTitle || "Untitled Product";
}
