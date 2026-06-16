import React, { DragEvent, useEffect, useState } from 'react';
import { getImgs, arrImgImport } from "src/providers/imgProvider";
import s from "./dropZone.module.css";
import dropFileType from 'src/types/dropFile';
import { useRouter } from 'next/router';

type callbackType = (val: dropFileType) => void;

interface IDropZone {
    onDrop: callbackType;
}

const DropZone: React.FC<any> = (props: IDropZone) => {
    const router = useRouter();
    const { load } = router.query;
    console.log(load);

    getImgs("NIKE", () => {});
    
    const { onDrop } = { ...props };
    const [dropFile, setDropFile] = useState<dropFileType | null>(null);

    const handleDrop = function(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        let item = e.dataTransfer.items[0].webkitGetAsEntry();
        let isDirectory = item?.isDirectory;
        console.log(item);
        let arr: File[] = [];
        
        if (item instanceof FileSystemDirectoryEntry) {
            let reader = item.createReader();
            reader.readEntries((entries) => {
                console.log(entries);

                Promise.all(entries.map((entry) => {
                    if (entry instanceof FileSystemFileEntry) {
                        return new Promise<File>((resolve, reject) => {
                            entry.file((file) => {
                                resolve(file);
                            });
                        });
                    }
                })).then((arr: (File | undefined)[]) => {
                    console.log(arr, "arr");
                    let sendArr: File[] = [];
                    arr.forEach((val, ind) => {
                        console.log(val, "kn;");
                        if (val) sendArr.push(val);
                        else console.warn("undefined on index " + ind);
                    });
                    console.log(sendArr.length, "sendArr");
                    arrImgImport(sendArr, setDropFile);
                }, (err) => {
                    throw new Error("Wrong file");
                });

                console.log(arr.length);
            });
        }
    };

    useEffect(() => {
        if (dropFile) {
            onDrop(dropFile);
        }
    }, [dropFile]);

    console.log("file", dropFile, "FILE  ");

    return (
        <div
            style={{ backgroundImage: `url(${dropFile?.src})` }}
            className={s.main}
            onDragEnter={(e) => { e.preventDefault(); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
        >
            <button onClick={() => {}}></button>
        </div>
    );
};

export default DropZone;