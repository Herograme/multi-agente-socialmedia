// Entity types - Social Content Agent
export var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["PENDING"] = "pending";
    ExecutionStatus["RUNNING"] = "running";
    ExecutionStatus["COMPLETED"] = "completed";
    ExecutionStatus["FAILED"] = "failed";
    ExecutionStatus["CANCELLED"] = "cancelled";
})(ExecutionStatus || (ExecutionStatus = {}));
export var PostStatus;
(function (PostStatus) {
    PostStatus["PENDING"] = "pending";
    PostStatus["APPROVED"] = "approved";
    PostStatus["REJECTED"] = "rejected";
})(PostStatus || (PostStatus = {}));
export var AssetType;
(function (AssetType) {
    AssetType["BACKGROUND_IMAGE"] = "background_image";
    AssetType["CAROUSEL_SLIDE"] = "carousel_slide";
    AssetType["PDF"] = "pdf";
})(AssetType || (AssetType = {}));
export var Platform;
(function (Platform) {
    Platform["INSTAGRAM"] = "instagram";
    Platform["LINKEDIN"] = "linkedin";
})(Platform || (Platform = {}));
//# sourceMappingURL=entities.js.map